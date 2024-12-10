package fshare

import (
	"encoding/json"
	"fmt"

	badger "github.com/dgraph-io/badger/v4"
)

// FileInfo defines the structure for file information
type FileInfo struct {
	Price        int
	Name         string
	Size         int
	FileType     string
	LastModified int
}

type KV struct {
	db *badger.DB
}

func OpenBadgerDB(pathToDb string) (*KV, error) {
	options := badger.DefaultOptions(pathToDb)
	options.Logger = nil // Disable logging for simplicity
	badgerInstance, err := badger.Open(options)
	if err != nil {
		return nil, fmt.Errorf("failed to open BadgerDB: %w", err)
	}
	return &KV{db: badgerInstance}, nil
}

func (k *KV) Close() error {
	return k.db.Close()
}

func (k *KV) SetFileInfo(key string, fileInfo FileInfo) error {
	data, err := json.Marshal(fileInfo)
	if err != nil {
		return fmt.Errorf("failed to serialize FileInfo: %w", err)
	}

	return k.db.Update(func(txn *badger.Txn) error {
		return txn.Set([]byte(key), data)
	})
}

func (k *KV) GetFileInfo(key string) (*FileInfo, error) {
	var fileInfo FileInfo

	err := k.db.View(
		func(txn *badger.Txn) error {
			item, err := txn.Get([]byte(key))
			if err != nil {
				return fmt.Errorf("failed to get FileInfo: %w", err)
			}
			valCopy, err := item.ValueCopy(nil)
			if err != nil {
				return fmt.Errorf("copying value: %w", err)
			}
			json.Unmarshal(valCopy, &fileInfo)
			return nil
		})

	if err != nil {
		return nil, err
	}

	return &fileInfo, nil
}

func (k *KV) DeleteFileInfo(key string) error {
	return k.db.Update(func(txn *badger.Txn) error {
		return txn.Delete([]byte(key))
	})
}

func (k *KV) GetAllFiles() ([]FileInfo, error) {
	var providedFiles []FileInfo
	err := k.db.View(func(txn *badger.Txn) error {
		opts := badger.DefaultIteratorOptions
		opts.PrefetchSize = 10
		it := txn.NewIterator(opts)
		defer it.Close()
		for it.Rewind(); it.Valid(); it.Next() {
			item := it.Item()
			var providedFile FileInfo
			err := item.Value(func(v []byte) error {
				err := json.Unmarshal(v, &providedFile)
				return err
			})

			if err != nil {
				return err
			}

			providedFiles = append(providedFiles, providedFile)
			if err != nil {
				return err
			}

		}
		return nil
	})

	if err != nil {
		return nil, err
	}

	return providedFiles, nil
}
