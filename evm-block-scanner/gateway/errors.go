package gateway

import "errors"

var (
	ErrNotConnected  = errors.New("gateway not connected")
	ErrSendQueueFull = errors.New("gateway send queue full")
)
