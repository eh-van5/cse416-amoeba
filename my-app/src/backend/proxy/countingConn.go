package proxy

import (
	"io"
	"sync/atomic"
)

type CountingConn struct {
	conn             io.ReadWriteCloser
	sentBytesPtr     *uint64
	receivedBytesPtr *uint64
}

func (c *CountingConn) Read(p []byte) (int, error) {
	n, err := c.conn.Read(p)
	if n > 0 {
		atomic.AddUint64(c.receivedBytesPtr, uint64(n))
	}
	return n, err
}

func (c *CountingConn) Write(p []byte) (int, error) {
	n, err := c.conn.Write(p)
	if n > 0 {
		atomic.AddUint64(c.sentBytesPtr, uint64(n))
	}
	return n, err
}

func (c *CountingConn) Close() error {
	return c.conn.Close()
}
