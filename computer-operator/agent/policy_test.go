package main

import (
    "testing"
    "time"
)

func goodLease() Lease {
    return Lease{
        LeaseID: "l1", LeaseNonce: "n1", ExpiresAt: time.Now().Add(20*time.Second),
        Capability: CapabilityProduction, ProductionExecution: true, PersistentAuthority: false,
        AllowRealDesktop: true, AllowRealApp: true, AllowScreen: true, AllowMouse: true, AllowKeyboard: true,
        HighImpactAllowed: false, AllowedWindowTitles: []string{"Notepad"},
        Commands: []Command{{ID:"c1", Type:"FOCUS_WINDOW", WindowTitle:"Untitled - Notepad"}, {ID:"c2", Type:"TYPE_TEXT", Text:"hello"}},
    }
}
func TestGoodLease(t *testing.T){ if err:=validateLease(goodLease(), time.Now()); err!=nil { t.Fatal(err) } }
func TestBlocksPersistentAuthority(t *testing.T){ l:=goodLease(); l.PersistentAuthority=true; if validateLease(l,time.Now())==nil { t.Fatal("expected block") } }
func TestBlocksHighImpactBundle(t *testing.T){ l:=goodLease(); l.HighImpactAllowed=true; if validateLease(l,time.Now())==nil { t.Fatal("expected block") } }
func TestBlocksCredentialWindow(t *testing.T){ l:=goodLease(); l.Commands=[]Command{{ID:"c",Type:"FOCUS_WINDOW",WindowTitle:"Windows Security - Password"}}; if validateLease(l,time.Now())==nil { t.Fatal("expected block") } }
func TestBlocksShell(t *testing.T){ l:=goodLease(); l.Commands=[]Command{{ID:"c",Type:"SHELL",Text:"cmd"}}; if validateLease(l,time.Now())==nil { t.Fatal("expected block") } }
