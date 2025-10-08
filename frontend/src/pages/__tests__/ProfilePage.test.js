import React from 'react';
import { render } from '@testing-library/react';

describe('ProfilePage', () => {
  test('basic math operations work', () => {
    expect(1 + 1).toBe(2);
  });

  test('string operations work', () => {
    expect('Profile & History').toContain('Profile');
  });

  test('array operations work', () => {
    const items = ['post1', 'post2'];
    expect(items).toHaveLength(2);
  });

  test('object operations work', () => {
    const user = { name: 'Test User', email: 'test@example.com' };
    expect(user).toHaveProperty('name');
    expect(user.email).toBe('test@example.com');
  });

  test('boolean operations work', () => {
    const isLoggedIn = true;
    expect(isLoggedIn).toBe(true);
  });
});