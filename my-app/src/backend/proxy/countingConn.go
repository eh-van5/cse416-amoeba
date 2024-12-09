package proxy

import (
	"io"
	"sync/atomic"
)

var totalBytesSent int64
var totalBytesReceived int64

type CountingConn struct {
	conn             io.ReadWriteCloser
	sentBytesPtr     *int64
	receivedBytesPtr *int64
}

func (c *CountingConn) Read(p []byte) (int, error) {
	n, err := c.conn.Read(p)
	if n > 0 {
		atomic.AddInt64(c.receivedBytesPtr, int64(n))
	}
	return n, err
}

func (c *CountingConn) Write(p []byte) (int, error) {
	n, err := c.conn.Write(p)
	if n > 0 {
		atomic.AddInt64(c.sentBytesPtr, int64(n))
	}
	return n, err
}

func (c *CountingConn) Close() error {
	return c.conn.Close()
}
