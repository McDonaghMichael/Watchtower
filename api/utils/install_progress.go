package utils

import "sync"

// InstallSession tracks real-time installation log output for one server.
// Subscribers receive all past lines immediately, then live lines as they arrive.
type InstallSession struct {
	mu    sync.Mutex
	lines []string
	subs  []chan string
	Done  bool
	Err   string
}

var installSessions sync.Map // key: int serverID → *InstallSession

// NewInstallSession creates and registers a fresh session for serverID.
func NewInstallSession(serverID int) *InstallSession {
	s := &InstallSession{}
	installSessions.Store(serverID, s)
	return s
}

// GetInstallSession retrieves an existing session by server ID.
func GetInstallSession(serverID int) (*InstallSession, bool) {
	v, ok := installSessions.Load(serverID)
	if !ok {
		return nil, false
	}
	return v.(*InstallSession), true
}

// Write appends a log line and fans it out to all current subscribers.
func (s *InstallSession) Write(line string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.lines = append(s.lines, line)
	for _, ch := range s.subs {
		select {
		case ch <- line:
		default: // drop if subscriber is too slow
		}
	}
}

// Finish marks the session as done (optionally with an error) and closes all subscriber channels.
func (s *InstallSession) Finish(errMsg string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.Done = true
	s.Err = errMsg
	for _, ch := range s.subs {
		close(ch)
	}
	s.subs = nil
}

// Subscribe returns a buffered channel that first receives all past lines, then live ones.
// If the session is already done the channel is closed after sending history.
func (s *InstallSession) Subscribe() chan string {
	s.mu.Lock()
	defer s.mu.Unlock()
	ch := make(chan string, 512)
	for _, line := range s.lines {
		ch <- line
	}
	if s.Done {
		close(ch)
		return ch
	}
	s.subs = append(s.subs, ch)
	return ch
}
