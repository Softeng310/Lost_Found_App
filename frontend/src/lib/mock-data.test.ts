import { getItemsClient } from './mock-data';

test('getItemsClient returns array of items', () => {
  const items = getItemsClient();
  expect(Array.isArray(items)).toBe(true);
  expect(items.length).toBeGreaterThan(0);
});

test('items have required properties', () => {
  const items = getItemsClient();
  items.forEach(item => {
    expect(item).toHaveProperty('id');
    expect(item).toHaveProperty('title');
    expect(item).toHaveProperty('reporter');
    expect(item).toHaveProperty('claims');
    expect(item).toHaveProperty('status');
  });
});
