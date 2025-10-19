/**
 * Tests for Firestore Normalizer Service
 * 
 * These tests demonstrate the benefits of centralized normalization:
 * 1. Easy to test all edge cases in one place
 * 2. Consistent handling of different timestamp formats
 * 3. Clear documentation of expected behavior
 */

import {
  normalizeTimestamp,
  extractDate,
  normalizeItem,
  normalizeMessage,
  normalizeConversation
} from './firestoreNormalizer';

describe('normalizeTimestamp', () => {
  it('should handle Firestore Timestamp with toDate method', () => {
    const mockTimestamp = {
      toDate: () => new Date('2024-01-15T10:30:00Z')
    };
    
    const result = normalizeTimestamp(mockTimestamp);
    expect(result).toBe('2024-01-15T10:30:00.000Z');
  });

  it('should handle Firestore snapshot with seconds property', () => {
    const mockSnapshot = {
      seconds: 1705315800, // Jan 15, 2024 10:30:00 UTC
      nanoseconds: 0
    };
    
    const result = normalizeTimestamp(mockSnapshot);
    expect(result).toBe('2024-01-15T10:30:00.000Z');
  });

  it('should handle Date objects', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    const result = normalizeTimestamp(date);
    expect(result).toBe('2024-01-15T10:30:00.000Z');
  });

  it('should handle ISO string timestamps', () => {
    const result = normalizeTimestamp('2024-01-15T10:30:00Z');
    expect(result).toBe('2024-01-15T10:30:00.000Z');
  });

  it('should handle number timestamps (milliseconds)', () => {
    const timestamp = new Date('2024-01-15T10:30:00Z').getTime();
    const result = normalizeTimestamp(timestamp);
    expect(result).toBe('2024-01-15T10:30:00.000Z');
  });

  it('should return null for invalid values', () => {
    expect(normalizeTimestamp(null)).toBeNull();
    expect(normalizeTimestamp(undefined)).toBeNull();
    expect(normalizeTimestamp('invalid-date')).toBeNull();
  });
});

describe('extractDate', () => {
  it('should extract date from first matching field', () => {
    const doc = {
      otherField: 'value',
      createdAt: { seconds: 1705315800 },
      date: { seconds: 1705315900 } // Different time
    };
    
    // Should use 'date' first (default field order)
    const result = extractDate(doc);
    expect(result).toBe('2024-01-15T10:31:40.000Z');
  });

  it('should fall back to other field names', () => {
    const doc = {
      created_at: { seconds: 1705315800 }
    };
    
    const result = extractDate(doc);
    expect(result).toBe('2024-01-15T10:30:00.000Z');
  });

  it('should support custom field names', () => {
    const doc = {
      lastModified: { seconds: 1705315800 }
    };
    
    const result = extractDate(doc, ['lastModified', 'updated']);
    expect(result).toBe('2024-01-15T10:30:00.000Z');
  });

  it('should return null if no valid date found', () => {
    const doc = {
      title: 'Some Item',
      description: 'No dates here'
    };
    
    const result = extractDate(doc);
    expect(result).toBeNull();
  });
});

describe('normalizeItem', () => {
  it('should handle all field name variations', () => {
    const rawItem = {
      title: 'Lost Wallet',
      description: 'Brown leather wallet',
      type: 'wallets', // Using 'type' instead of 'category'
      status: 'lost', // Using 'status' instead of 'kind'
      imageURL: 'https://example.com/image.jpg', // Using 'imageURL' instead of 'imageUrl'
      location: 'OGGB',
      date: { seconds: 1705315800 },
      claimed: true,
      claimedAt: { seconds: 1705320000 }
    };

    const result = normalizeItem(rawItem, 'item123');

    expect(result.id).toBe('item123');
    expect(result.title).toBe('Lost Wallet');
    expect(result.category).toBe('wallets');
    expect(result.kind).toBe('lost');
    expect(result.imageUrl).toBe('https://example.com/image.jpg');
    expect(result.claimed).toBe(true);
    expect(result.date).toBe('2024-01-15T10:30:00.000Z');
    expect(result.claimedAt).toBe('2024-01-15T11:40:00.000Z');
  });

  it('should handle alternative field names', () => {
    const rawItem = {
      title: 'Found Keys',
      category: 'keys/cards', // Alternative field name
      kind: 'found', // Alternative field name
      imageUrl: 'https://example.com/keys.jpg', // Alternative field name
      createdAt: { seconds: 1705315800 } // Alternative date field
    };

    const result = normalizeItem(rawItem, 'item456');

    expect(result.category).toBe('keys/cards');
    expect(result.kind).toBe('found');
    expect(result.imageUrl).toBe('https://example.com/keys.jpg');
    expect(result.date).toBe('2024-01-15T10:30:00.000Z');
  });

  it('should provide defaults for missing fields', () => {
    const rawItem = {
      title: 'Minimal Item'
    };

    const result = normalizeItem(rawItem, 'item789');

    expect(result.description).toBe('');
    expect(result.category).toBe('');
    expect(result.kind).toBe('lost'); // Default
    expect(result.imageUrl).toBe('');
    expect(result.claimed).toBe(false);
    expect(result.claimedAt).toBeNull();
  });

  it('should preserve original data for debugging', () => {
    const rawItem = {
      title: 'Test Item',
      customField: 'custom value'
    };

    const result = normalizeItem(rawItem, 'test');

    expect(result._raw).toEqual(rawItem);
    expect(result._raw.customField).toBe('custom value');
  });
});

describe('normalizeMessage', () => {
  it('should normalize message with all fields', () => {
    const rawMessage = {
      conversationId: 'conv123',
      senderId: 'user456',
      senderName: 'John Doe',
      text: 'Hello, is this still available?',
      timestamp: { seconds: 1705315800 }
    };

    const result = normalizeMessage(rawMessage, 'msg789');

    expect(result.id).toBe('msg789');
    expect(result.conversationId).toBe('conv123');
    expect(result.senderId).toBe('user456');
    expect(result.text).toBe('Hello, is this still available?');
    expect(result.timestamp).toBe('2024-01-15T10:30:00.000Z');
  });

  it('should provide defaults for missing sender info', () => {
    const rawMessage = {
      text: 'Test message'
    };

    const result = normalizeMessage(rawMessage, 'msg001');

    expect(result.senderName).toBe('Unknown');
    expect(result.conversationId).toBe('');
  });
});

describe('normalizeConversation', () => {
  it('should normalize conversation data', () => {
    const rawConversation = {
      participants: ['user1', 'user2'],
      itemId: 'item123',
      lastMessage: 'Thanks!',
      lastMessageTime: { seconds: 1705315800 },
      lastMessageSender: 'user2',
      createdAt: { seconds: 1705310000 }
    };

    const result = normalizeConversation(rawConversation, 'conv456');

    expect(result.id).toBe('conv456');
    expect(result.participants).toEqual(['user1', 'user2']);
    expect(result.itemId).toBe('item123');
    expect(result.lastMessage).toBe('Thanks!');
    expect(result.lastMessageTime).toBe('2024-01-15T10:30:00.000Z');
    expect(result.createdAt).toBe('2024-01-15T09:06:40.000Z');
  });
});
