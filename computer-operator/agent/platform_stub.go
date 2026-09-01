//go:build !windows
package main
func fileExists(path string) bool { return false }
func main() {}
