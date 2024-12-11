package fshare

import (
	"context"
	"fmt"
	"log"

	pubsub "github.com/libp2p/go-libp2p-pubsub"
	"github.com/libp2p/go-libp2p/core/host"
)

func PubSub(ctx context.Context, node host.Host) {
	ps, err := pubsub.NewGossipSub(ctx, node)
	if err != nil {
		log.Fatalf("Failed to create pubsub: %v", err)
		return
	}

	// Subscribe to a discovery topic
	topic, err := ps.Join("peer-discovery")
	if err != nil {
		log.Fatalf("Failed to join topic: %v", err)
		return
	}

	sub, err := topic.Subscribe()
	if err != nil {
		log.Fatalf("Failed to subscribe to topic: %v", err)
		return
	}

	// Announce your presence
	err = topic.Publish(ctx, []byte(node.ID().String()))
	if err != nil {
		log.Fatalf("Failed to publish to topic: %v", err)
		return
	}

	for {
		msg, err := sub.Next(ctx)
		if err != nil {
			log.Fatalf("Error reading from subscription: %v", err)
		}

		fmt.Printf("Discovered peer: %s\n", string(msg.Data))
	}
}
