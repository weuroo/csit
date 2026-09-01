//go:build windows

package main

import (
    "bytes"
    "context"
    "crypto/ed25519"
    "crypto/rand"
    "crypto/sha256"
    "encoding/base64"
    "encoding/hex"
    "encoding/json"
    "errors"
    "fmt"
    "image"
    "image/color"
    "image/png"
    "io"
    "net/http"
    "os"
    "path/filepath"
    "sort"
    "strings"
    "syscall"
    "time"
    "unsafe"
)

const agentVersion = "1.0.0-production-candidate"

// buildEnrollmentToken is injected only into the owner-specific build via -ldflags.
// It must remain empty in source control and is consumed after first registration.
var buildEnrollmentToken = ""

var (
    user32 = syscall.NewLazyDLL("user32.dll")
    gdi32 = syscall.NewLazyDLL("gdi32.dll")
    crypt32 = syscall.NewLazyDLL("crypt32.dll")
    kernel32 = syscall.NewLazyDLL("kernel32.dll")

    procGetDC = user32.NewProc("GetDC")
    procReleaseDC = user32.NewProc("ReleaseDC")
    procSetCursorPos = user32.NewProc("SetCursorPos")
    procMouseEvent = user32.NewProc("mouse_event")
    procSendInput = user32.NewProc("SendInput")
    procEnumWindows = user32.NewProc("EnumWindows")
    procGetWindowTextLengthW = user32.NewProc("GetWindowTextLengthW")
    procGetWindowTextW = user32.NewProc("GetWindowTextW")
    procIsWindowVisible = user32.NewProc("IsWindowVisible")
    procSetForegroundWindow = user32.NewProc("SetForegroundWindow")
    procGetForegroundWindow = user32.NewProc("GetForegroundWindow")
    procGetWindowRect = user32.NewProc("GetWindowRect")

    procCreateCompatibleDC = gdi32.NewProc("CreateCompatibleDC")
    procCreateCompatibleBitmap = gdi32.NewProc("CreateCompatibleBitmap")
    procSelectObject = gdi32.NewProc("SelectObject")
    procBitBlt = gdi32.NewProc("BitBlt")
    procGetDIBits = gdi32.NewProc("GetDIBits")
    procDeleteObject = gdi32.NewProc("DeleteObject")
    procDeleteDC = gdi32.NewProc("DeleteDC")

    procCryptProtectData = crypt32.NewProc("CryptProtectData")
    procCryptUnprotectData = crypt32.NewProc("CryptUnprotectData")
    procLocalFree = kernel32.NewProc("LocalFree")
)

const (
    srcCopy = 0x00CC0020
    dibRGBColors = 0
    biRGB = 0
    mouseeventfLeftDown = 0x0002
    mouseeventfLeftUp = 0x0004
    inputKeyboard = 1
    keyeventfKeyUp = 0x0002
    keyeventfUnicode = 0x0004
)

type dataBlob struct { cbData uint32; pbData *byte }
type bitmapInfoHeader struct {
    Size uint32; Width int32; Height int32; Planes uint16; BitCount uint16;
    Compression uint32; SizeImage uint32; XPelsPerMeter int32; YPelsPerMeter int32; ClrUsed uint32; ClrImportant uint32
}
type bitmapInfo struct { Header bitmapInfoHeader; Colors [1]uint32 }
type winRect struct { Left, Top, Right, Bottom int32 }
type keyboardInput struct { Vk uint16; Scan uint16; Flags uint32; Time uint32; ExtraInfo uintptr }
type input struct { Type uint32; _ uint32; Ki keyboardInput; _pad [8]byte }

type identityFile struct { Public string `json:"public_key_ed25519"`; ProtectedPrivate string `json:"protected_private_key"`; DeviceKey string `json:"device_key"` }
type signedEnvelope struct { Payload map[string]any `json:"payload"`; Signature string `json:"signature_ed25519"` }
type pollResponse struct { OK bool `json:"ok"`; Code string `json:"code"`; Lease *Lease `json:"lease,omitempty"` }
type commandResult struct { CommandID string `json:"command_id"`; Type string `json:"type"`; OK bool `json:"ok"`; Error string `json:"error,omitempty"`; Data map[string]any `json:"data,omitempty"` }

type runtime struct {
    endpoint string
    client *http.Client
    private ed25519.PrivateKey
    public ed25519.PublicKey
    deviceKey string
    stopPath string
}

func main() {
    rt, err := newRuntime()
    if err != nil { fmt.Println("FAILED -", err); fmt.Println("Press any key to close . . ."); _, _ = fmt.Scanln(); return }
    fmt.Println("Paojai Computer Operator Production Candidate v1.0.0")
    fmt.Println("Device:", rt.deviceKey)
    fmt.Println("FAIL CLOSED: production actions require exact short lease + Owner authorization")
    fmt.Println("Local emergency stop:", rt.stopPath)
    fmt.Println("Blocked: shell / files / clipboard / credentials / money / ads / publish / legal / HR / deletion")
    for {
        if localStopPresent(rt.stopPath) { fmt.Println("[STOP] Local emergency stop active"); time.Sleep(2*time.Second); continue }
        if err := rt.pollOnce(context.Background()); err != nil { fmt.Println("[WAIT]", err) }
        time.Sleep(2*time.Second)
    }
}

func newRuntime() (*runtime, error) {
    base := os.Getenv("LOCALAPPDATA")
    if base == "" { return nil, errors.New("LOCALAPPDATA unavailable") }
    dir := filepath.Join(base, "PaojaiComputerOperatorV1")
    if err := os.MkdirAll(dir, 0700); err != nil { return nil, err }
    pub, priv, deviceKey, err := loadOrCreateIdentity(filepath.Join(dir, "identity.json"))
    if err != nil { return nil, err }
    endpoint := strings.TrimSpace(os.Getenv("PAOJAI_OPERATOR_URL"))
    if endpoint == "" { endpoint = "https://bvnmwfhqgdevupvcqqyl.supabase.co/functions/v1/pm-computer-operator-production-runtime-v1" }
    return &runtime{endpoint:endpoint, client:&http.Client{Timeout:12*time.Second}, private:priv, public:pub, deviceKey:deviceKey, stopPath:filepath.Join(dir,"STOP")}, nil
}

func loadOrCreateIdentity(path string) (ed25519.PublicKey, ed25519.PrivateKey, string, error) {
    if b, err := os.ReadFile(path); err == nil {
        var f identityFile; if json.Unmarshal(b,&f)!=nil { return nil,nil,"",errors.New("identity file invalid") }
        pub, err := base64.RawURLEncoding.DecodeString(f.Public); if err!=nil || len(pub)!=ed25519.PublicKeySize { return nil,nil,"",errors.New("public key invalid") }
        enc, err := base64.RawURLEncoding.DecodeString(f.ProtectedPrivate); if err!=nil { return nil,nil,"",errors.New("private key envelope invalid") }
        raw, err := dpapiUnprotect(enc); if err!=nil || len(raw)!=ed25519.PrivateKeySize { return nil,nil,"",errors.New("private key unprotect failed") }
        dk := deriveDeviceKey(pub); if f.DeviceKey!="" && f.DeviceKey!=dk { return nil,nil,"",errors.New("device identity mismatch") }
        return ed25519.PublicKey(pub),ed25519.PrivateKey(raw),dk,nil
    }
    pub, priv, err := ed25519.GenerateKey(rand.Reader); if err!=nil { return nil,nil,"",err }
    enc, err := dpapiProtect(priv); if err!=nil { return nil,nil,"",err }
    f:=identityFile{Public:base64.RawURLEncoding.EncodeToString(pub),ProtectedPrivate:base64.RawURLEncoding.EncodeToString(enc),DeviceKey:deriveDeviceKey(pub)}
    b,_:=json.MarshalIndent(f,"","  "); if err:=os.WriteFile(path,b,0600); err!=nil{return nil,nil,"",err}
    return pub,priv,f.DeviceKey,nil
}

func deriveDeviceKey(pub []byte) string { h:=sha256.Sum256(pub); return "computer_"+hex.EncodeToString(h[:])[:32] }

func (r *runtime) pollOnce(ctx context.Context) error {
    payload := r.basePayload("poll")
    var pr pollResponse
    status, err := r.post(ctx,payload,&pr)
    if err != nil { return err }
    if status==401 || status==403 || status==423 { return fmt.Errorf("not authorized yet: %s",pr.Code) }
    if status!=200 { return fmt.Errorf("server status %d: %s",status,pr.Code) }
    if pr.Lease==nil { return nil }
    if err:=validateLease(*pr.Lease,time.Now());err!=nil { _=r.abort(ctx,*pr.Lease,"LOCAL_POLICY_REJECTED:"+err.Error()); return err }
    results:=make([]commandResult,0,len(pr.Lease.Commands))
    for _,cmd:=range pr.Lease.Commands {
        if localStopPresent(r.stopPath) { _=r.abort(ctx,*pr.Lease,"LOCAL_EMERGENCY_STOP_ACTIVE"); return errors.New("local emergency stop") }
        if time.Now().After(pr.Lease.ExpiresAt) { _=r.abort(ctx,*pr.Lease,"LEASE_EXPIRED_LOCAL"); return errors.New("lease expired") }
        res:=r.execute(cmd,*pr.Lease); results=append(results,res)
        if !res.OK { _=r.abort(ctx,*pr.Lease,"COMMAND_FAILED:"+res.Error); return errors.New(res.Error) }
    }
    body:=r.basePayload("complete"); body["lease_id"]=pr.Lease.LeaseID; body["lease_nonce"]=pr.Lease.LeaseNonce; body["results"]=results
    var out map[string]any; status,err=r.post(ctx,body,&out); if err!=nil{return err}; if status!=200{return fmt.Errorf("completion rejected: %v",out)}
    fmt.Println("[PASS] lease",pr.Lease.LeaseID,"commands",len(results))
    return nil
}

func (r *runtime) basePayload(action string) map[string]any {
    return map[string]any{
        "schema":"PAOJAI_COMPUTER_OPERATOR_PRODUCTION_CLIENT_V1","mode":"PRODUCTION_CANDIDATE","action":action,
        "device_key":r.deviceKey,"device_public_key_ed25519":base64.RawURLEncoding.EncodeToString(r.public),
        "issued_at_unix":time.Now().Unix(),"nonce":randomNonce(),"agent_version":agentVersion,
        "capabilities":[]string{CapabilityProduction},"persistent_execution_authority":false,"persistent_sensor_authority":false,
        "shell_access":false,"file_write":false,"clipboard_access":false,"network_discovery":false,"high_impact_allowed":false,
    }
}

func randomNonce() string { b:=make([]byte,24); _,_=rand.Read(b); return base64.RawURLEncoding.EncodeToString(b) }

func (r *runtime) post(ctx context.Context, payload map[string]any, out any) (int,error) {
    canonicalBytes,err:=json.Marshal(sortObject(payload)); if err!=nil{return 0,err}
    sig:=ed25519.Sign(r.private,canonicalBytes)
    env:=signedEnvelope{Payload:payload,Signature:base64.RawURLEncoding.EncodeToString(sig)}
    b,_:=json.Marshal(env); req,_:=http.NewRequestWithContext(ctx,http.MethodPost,r.endpoint,bytes.NewReader(b)); req.Header.Set("content-type","application/json"); if buildEnrollmentToken!="" { req.Header.Set("x-pm-computer-candidate-enrollment",buildEnrollmentToken) }
    resp,err:=r.client.Do(req); if err!=nil{return 0,err}; defer resp.Body.Close(); rb,_:=io.ReadAll(io.LimitReader(resp.Body,2<<20)); if len(rb)>0 && out!=nil {_=json.Unmarshal(rb,out)}; return resp.StatusCode,nil
}

func sortObject(v any) any {
    switch x:=v.(type) {
    case map[string]any:
        keys:=make([]string,0,len(x));for k:=range x{keys=append(keys,k)};sort.Strings(keys); m:=make(map[string]any,len(x));for _,k:=range keys{m[k]=sortObject(x[k])};return orderedMap{keys:keys,m:m}
    case []string:
        a:=make([]any,len(x));for i,v:=range x{a[i]=v};return a
    case []any:
        a:=make([]any,len(x));for i,v:=range x{a[i]=sortObject(v)};return a
    default:return v
    }
}

type orderedMap struct{keys []string;m map[string]any}
func (o orderedMap) MarshalJSON()([]byte,error){var b bytes.Buffer;b.WriteByte('{');for i,k:=range o.keys{if i>0{b.WriteByte(',')};kb,_:=json.Marshal(k);vb,err:=json.Marshal(sortObject(o.m[k]));if err!=nil{return nil,err};b.Write(kb);b.WriteByte(':');b.Write(vb)};b.WriteByte('}');return b.Bytes(),nil}

func (r *runtime) abort(ctx context.Context,l Lease,reason string) error { p:=r.basePayload("abort");p["lease_id"]=l.LeaseID;p["lease_nonce"]=l.LeaseNonce;p["reason"]=reason;var out any;_,err:=r.post(ctx,p,&out);return err }

func (r *runtime) execute(c Command,l Lease) commandResult {
    res:=commandResult{CommandID:c.ID,Type:c.Type,OK:false,Data:map[string]any{}}
    if c.Type!="FOCUS_WINDOW" {
        title:=foregroundWindowTitle(); if !windowAllowed(title,l.AllowedWindowTitles){res.Error="FOREGROUND_WINDOW_NOT_ALLOWLISTED";return res}
        res.Data["foreground_window_title"]=title
    }
    switch c.Type {
    case "FOCUS_WINDOW": if err:=focusWindow(c.WindowTitle);err!=nil{res.Error=err.Error();return res}
    case "MOUSE_MOVE": if ok,_,_:=procSetCursorPos.Call(uintptr(c.X),uintptr(c.Y));ok==0{res.Error="SET_CURSOR_FAILED";return res}
    case "MOUSE_CLICK": procMouseEvent.Call(mouseeventfLeftDown,0,0,0,0);procMouseEvent.Call(mouseeventfLeftUp,0,0,0,0)
    case "TYPE_TEXT": if err:=sendUnicode(c.Text);err!=nil{res.Error=err.Error();return res};res.Data["char_count"]=len([]rune(c.Text))
    case "KEY_PRESS": if err:=sendNamedKey(c.Key);err!=nil{res.Error=err.Error();return res}
    case "SCREEN_CAPTURE": b,w,h,err:=captureForegroundWindowPNG(c.MaskRects);if err!=nil{res.Error=err.Error();return res};res.Data["image_b64"]=base64.StdEncoding.EncodeToString(b);res.Data["content_type"]="image/png";res.Data["width"]=w;res.Data["height"]=h;res.Data["sha256"]=hex.EncodeToString(hashBytes(b))
    default: res.Error="ACTION_NOT_ALLOWED";return res
    }
    res.OK=true;return res
}

func hashBytes(b []byte) []byte { h:=sha256.Sum256(b); return h[:] }
func fileExists(path string) bool { _,err:=os.Stat(path); return err==nil }

func foregroundWindowTitle() string { h,_,_:=procGetForegroundWindow.Call();if h==0{return ""};return windowText(h) }
func windowText(hwnd uintptr) string { n,_,_:=procGetWindowTextLengthW.Call(hwnd);if n==0{return ""};buf:=make([]uint16,n+1);procGetWindowTextW.Call(hwnd,uintptr(unsafe.Pointer(&buf[0])),n+1);return syscall.UTF16ToString(buf) }
func focusWindow(target string) error {
    var found uintptr
    needle:=strings.ToLower(target)
    cb:=syscall.NewCallback(func(hwnd uintptr,lparam uintptr) uintptr {v,_,_:=procIsWindowVisible.Call(hwnd);if v==0{return 1};t:=windowText(hwnd);if windowAllowed(t,[]string{needle}){found=hwnd;return 0};return 1})
    procEnumWindows.Call(cb,0);if found==0{return errors.New("ALLOWLISTED_WINDOW_NOT_FOUND")};ok,_,_:=procSetForegroundWindow.Call(found);if ok==0{return errors.New("SET_FOREGROUND_WINDOW_FAILED")};time.Sleep(120*time.Millisecond);return nil
}

func sendUnicode(text string) error {
    for _,r:=range text { if r==0{return errors.New("NUL_TEXT_BLOCKED")}; if r>0xFFFF{return errors.New("NON_BMP_TEXT_BLOCKED")}; if err:=sendUnicodeRune(uint16(r));err!=nil{return err} }
    return nil
}
func sendUnicodeRune(scan uint16) error { down:=input{Type:inputKeyboard,Ki:keyboardInput{Scan:scan,Flags:keyeventfUnicode}};up:=input{Type:inputKeyboard,Ki:keyboardInput{Scan:scan,Flags:keyeventfUnicode|keyeventfKeyUp}};arr:=[]input{down,up};r,_,e:=procSendInput.Call(uintptr(len(arr)),uintptr(unsafe.Pointer(&arr[0])),unsafe.Sizeof(arr[0]));if r!=uintptr(len(arr)){return fmt.Errorf("SEND_INPUT_FAILED:%v",e)};return nil }
func sendNamedKey(name string) error { vk:=map[string]uint16{"ENTER":0x0D,"TAB":0x09,"ESC":0x1B,"BACKSPACE":0x08,"LEFT":0x25,"UP":0x26,"RIGHT":0x27,"DOWN":0x28}[strings.ToUpper(name)];if vk==0{return errors.New("KEY_NOT_ALLOWED")};down:=input{Type:inputKeyboard,Ki:keyboardInput{Vk:vk}};up:=input{Type:inputKeyboard,Ki:keyboardInput{Vk:vk,Flags:keyeventfKeyUp}};arr:=[]input{down,up};r,_,e:=procSendInput.Call(uintptr(len(arr)),uintptr(unsafe.Pointer(&arr[0])),unsafe.Sizeof(arr[0]));if r!=uintptr(len(arr)){return fmt.Errorf("SEND_KEY_FAILED:%v",e)};return nil }

func captureForegroundWindowPNG(masks []Rect)([]byte,int,int,error){
    hwnd,_,_:=procGetForegroundWindow.Call();if hwnd==0{return nil,0,0,errors.New("NO_FOREGROUND_WINDOW")}
    var rc winRect;ok,_,_:=procGetWindowRect.Call(hwnd,uintptr(unsafe.Pointer(&rc)));if ok==0{return nil,0,0,errors.New("GET_WINDOW_RECT_FAILED")}
    x0,y0:=int(rc.Left),int(rc.Top);w,h:=int(rc.Right-rc.Left),int(rc.Bottom-rc.Top);if w<=0||h<=0||w>10000||h>10000{return nil,0,0,errors.New("INVALID_WINDOW_SIZE")}
    hdc,_,_:=procGetDC.Call(0);if hdc==0{return nil,0,0,errors.New("GET_DC_FAILED")};defer procReleaseDC.Call(0,hdc)
    mem,_,_:=procCreateCompatibleDC.Call(hdc);if mem==0{return nil,0,0,errors.New("CREATE_DC_FAILED")};defer procDeleteDC.Call(mem)
    bmp,_,_:=procCreateCompatibleBitmap.Call(hdc,uintptr(w),uintptr(h));if bmp==0{return nil,0,0,errors.New("CREATE_BITMAP_FAILED")};defer procDeleteObject.Call(bmp)
    old,_,_:=procSelectObject.Call(mem,bmp);defer procSelectObject.Call(mem,old)
    ok,_,_=procBitBlt.Call(mem,0,0,uintptr(w),uintptr(h),hdc,uintptr(x0),uintptr(y0),srcCopy);if ok==0{return nil,0,0,errors.New("BITBLT_FAILED")}
    bmi:=bitmapInfo{Header:bitmapInfoHeader{Size:uint32(unsafe.Sizeof(bitmapInfoHeader{})),Width:int32(w),Height:-int32(h),Planes:1,BitCount:32,Compression:biRGB}}
    raw:=make([]byte,w*h*4);lines,_,_:=procGetDIBits.Call(mem,bmp,0,uintptr(h),uintptr(unsafe.Pointer(&raw[0])),uintptr(unsafe.Pointer(&bmi)),dibRGBColors);if int(lines)!=h{return nil,0,0,errors.New("GET_DIBITS_FAILED")}
    img:=image.NewRGBA(image.Rect(0,0,w,h));for y:=0;y<h;y++{for x:=0;x<w;x++{i:=(y*w+x)*4;b,g,r:=raw[i],raw[i+1],raw[i+2];img.SetRGBA(x,y,color.RGBA{R:r,G:g,B:b,A:255})}}
    for _,m:=range masks{for y:=maxInt(0,m.Y);y<minInt(h,m.Y+m.H);y++{for x:=maxInt(0,m.X);x<minInt(w,m.X+m.W);x++{img.SetRGBA(x,y,color.RGBA{R:0,G:0,B:0,A:255})}}}
    if w>1280 || h>800 { scale:=minFloat(1280/float64(w),800/float64(h));nw,nh:=maxInt(1,int(float64(w)*scale)),maxInt(1,int(float64(h)*scale));small:=image.NewRGBA(image.Rect(0,0,nw,nh));for y:=0;y<nh;y++{sy:=minInt(h-1,int(float64(y)/scale));for x:=0;x<nw;x++{sx:=minInt(w-1,int(float64(x)/scale));small.Set(x,y,img.At(sx,sy))}};img=small;w,h=nw,nh }
    var buf bytes.Buffer;if err:=png.Encode(&buf,img);err!=nil{return nil,0,0,err};if buf.Len()>1200000{return nil,0,0,errors.New("SCREENSHOT_TOO_LARGE")};return buf.Bytes(),w,h,nil
}
func minFloat(a,b float64)float64{if a<b{return a};return b}
func minInt(a,b int)int{if a<b{return a};return b};func maxInt(a,b int)int{if a>b{return a};return b}

func dpapiProtect(in []byte)([]byte,error){return dpapi(in,true)}
func dpapiUnprotect(in []byte)([]byte,error){return dpapi(in,false)}
func dpapi(in []byte,protect bool)([]byte,error){if len(in)==0{return nil,errors.New("empty dpapi input")};ib:=dataBlob{cbData:uint32(len(in)),pbData:&in[0]};var ob dataBlob;var r uintptr;var e error;if protect{r,_,e=procCryptProtectData.Call(uintptr(unsafe.Pointer(&ib)),0,0,0,0,0,uintptr(unsafe.Pointer(&ob)))}else{r,_,e=procCryptUnprotectData.Call(uintptr(unsafe.Pointer(&ib)),0,0,0,0,0,uintptr(unsafe.Pointer(&ob)))};if r==0{return nil,fmt.Errorf("DPAPI_FAILED:%v",e)};defer procLocalFree.Call(uintptr(unsafe.Pointer(ob.pbData)));out:=make([]byte,ob.cbData);copy(out,unsafe.Slice(ob.pbData,ob.cbData));return out,nil}
