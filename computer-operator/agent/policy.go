package main

import (
    "errors"
    "fmt"
    "strings"
    "time"
)

const (
    CapabilityProduction = "COMPUTER_OPERATOR_PRODUCTION_V1"
    CapabilityReleaseProof = "COMPUTER_OPERATOR_REAL_APP_RELEASE_PROOF_V1"
    MaxLeaseSeconds = 30
    MaxCommandsPerLease = 12
    MaxTypedChars = 512
)

type Command struct {
    ID string `json:"command_id"`
    Type string `json:"type"`
    X int32 `json:"x,omitempty"`
    Y int32 `json:"y,omitempty"`
    Button string `json:"button,omitempty"`
    Text string `json:"text,omitempty"`
    Key string `json:"key,omitempty"`
    WindowTitle string `json:"window_title,omitempty"`
    MaskRects []Rect `json:"mask_rects,omitempty"`
    Meta map[string]any `json:"meta,omitempty"`
}

type Rect struct { X, Y, W, H int }

type Lease struct {
    LeaseID string `json:"lease_id"`
    LeaseNonce string `json:"lease_nonce"`
    ExpiresAt time.Time `json:"expires_at"`
    Capability string `json:"capability"`
    ProductionExecution bool `json:"production_execution"`
    PersistentAuthority bool `json:"persistent_execution_authority"`
    AllowRealDesktop bool `json:"allow_real_desktop"`
    AllowRealApp bool `json:"allow_real_app"`
    AllowScreen bool `json:"allow_screen"`
    AllowMouse bool `json:"allow_mouse"`
    AllowKeyboard bool `json:"allow_keyboard"`
    HighImpactAllowed bool `json:"high_impact_allowed"`
    AllowedWindowTitles []string `json:"allowed_window_titles"`
    Commands []Command `json:"commands"`
}

var blockedWindowTerms = []string{
    "password", "passkey", "windows security", "credential", "1password",
    "bitwarden", "keepass", "bank", "payment", "wallet", "recovery code",
}

func validateLease(l Lease, now time.Time) error {
    if l.Capability != CapabilityProduction { return fmt.Errorf("wrong capability: %s", l.Capability) }
    if !l.ProductionExecution || l.PersistentAuthority { return errors.New("unsafe authority contract") }
    if !l.AllowRealDesktop || !l.AllowRealApp { return errors.New("real authorized surface not granted") }
    if l.HighImpactAllowed { return errors.New("high impact cannot be bundled") }
    if l.LeaseID == "" || l.LeaseNonce == "" { return errors.New("missing lease identity") }
    if !l.ExpiresAt.After(now) || l.ExpiresAt.Sub(now) > MaxLeaseSeconds*time.Second { return errors.New("lease ttl invalid") }
    if len(l.Commands) == 0 || len(l.Commands) > MaxCommandsPerLease { return errors.New("command count invalid") }
    for _, c := range l.Commands { if err := validateCommand(c, l); err != nil { return err } }
    return nil
}

func validateCommand(c Command, l Lease) error {
    if c.ID == "" { return errors.New("missing command id") }
    switch c.Type {
    case "SCREEN_CAPTURE":
        if !l.AllowScreen { return errors.New("screen not granted") }
    case "MOUSE_MOVE":
        if !l.AllowMouse { return errors.New("mouse not granted") }
    case "MOUSE_CLICK":
        if !l.AllowMouse { return errors.New("mouse not granted") }
        if c.Button != "left" { return errors.New("only left click allowed in v1") }
    case "TYPE_TEXT":
        if !l.AllowKeyboard { return errors.New("keyboard not granted") }
        if len([]rune(c.Text)) == 0 || len([]rune(c.Text)) > MaxTypedChars { return errors.New("typed text length invalid") }
    case "KEY_PRESS":
        if !l.AllowKeyboard { return errors.New("keyboard not granted") }
        switch strings.ToUpper(c.Key) { case "ENTER", "TAB", "ESC", "BACKSPACE", "UP", "DOWN", "LEFT", "RIGHT": default: return errors.New("key not allowlisted") }
    case "FOCUS_WINDOW":
        if c.WindowTitle == "" || !windowAllowed(c.WindowTitle, l.AllowedWindowTitles) { return errors.New("window target not allowlisted") }
    default:
        return fmt.Errorf("command type not allowed: %s", c.Type)
    }
    return nil
}

func windowAllowed(title string, allow []string) bool {
    t := strings.ToLower(strings.TrimSpace(title))
    if t == "" { return false }
    for _, x := range blockedWindowTerms { if strings.Contains(t, x) { return false } }
    for _, a := range allow {
        a = strings.ToLower(strings.TrimSpace(a))
        if a != "" && strings.Contains(t, a) { return true }
    }
    return false
}

func localStopPresent(stopPath string) bool { return fileExists(stopPath) }
