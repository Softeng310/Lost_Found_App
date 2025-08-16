import { render, screen } from '@testing-library/react';
import { Badge } from './badge';

describe('Badge Component', () => {
  test('renders Badge with default variant', () => {
    render(<Badge>Default Badge</Badge>);
    expect(screen.getByText('Default Badge')).toBeInTheDocument();
  });

  test('renders Badge with outline variant', () => {
    render(<Badge variant="outline">Outline Badge</Badge>);
    expect(screen.getByText('Outline Badge')).toBeInTheDocument();
  });

  test('renders Badge with custom className', () => {
    render(<Badge className="custom-badge">Custom Badge</Badge>);
    const badge = screen.getByText('Custom Badge');
    expect(badge).toHaveClass('custom-badge');
  });

  test('renders Badge with outline variant and custom className', () => {
    render(<Badge variant="outline" className="outline-custom">Outline Custom</Badge>);
    const badge = screen.getByText('Outline Custom');
    expect(badge).toHaveClass('outline-custom');
  });
});
