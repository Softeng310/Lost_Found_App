import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardContent } from './card';

describe('Card Components', () => {
  test('renders Card component', () => {
    render(<Card>Test content</Card>);
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  test('renders Card with custom className', () => {
    render(<Card className="custom-class">Test content</Card>);
    const card = screen.getByText('Test content').closest('div');
    expect(card).toHaveClass('custom-class');
  });

  test('renders CardHeader component', () => {
    render(<CardHeader>Header content</CardHeader>);
    expect(screen.getByText('Header content')).toBeInTheDocument();
  });

  test('renders CardTitle component', () => {
    render(<CardTitle>Card Title</CardTitle>);
    expect(screen.getByText('Card Title')).toBeInTheDocument();
  });

  test('renders CardTitle with custom className', () => {
    render(<CardTitle className="title-class">Card Title</CardTitle>);
    const title = screen.getByText('Card Title');
    expect(title).toHaveClass('title-class');
  });

  test('renders CardContent component', () => {
    render(<CardContent>Content text</CardContent>);
    expect(screen.getByText('Content text')).toBeInTheDocument();
  });

  test('renders CardContent with custom className', () => {
    render(<CardContent className="content-class">Content text</CardContent>);
    const content = screen.getByText('Content text').closest('div');
    expect(content).toHaveClass('content-class');
  });
});
