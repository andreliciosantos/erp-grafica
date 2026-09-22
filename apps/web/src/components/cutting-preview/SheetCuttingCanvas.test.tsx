import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { SheetCuttingCanvas } from './SheetCuttingCanvas';

describe('SheetCuttingCanvas component', () => {
  const defaultProps = {
    sheetWidthMm: 660,
    sheetHeightMm: 960,
    productWidthMm: 210,
    productHeightMm: 297,
    bleedMm: 3,
    gripMm: 10,
    itemsPerSheet: 9,
    sheetsRequired: 123,
    totalQuantity: 1000,
    isRotated: false,
  };

  it('should render the canvas header and sheet dimensions', () => {
    render(<SheetCuttingCanvas {...defaultProps} />);

    expect(screen.getByText(/simulador de imposição & aproveitamento/i)).toBeInTheDocument();
    expect(screen.getByText(/folha: 660x960 mm/i)).toBeInTheDocument();
  });

  it('should render calculation metrics correctly', () => {
    render(<SheetCuttingCanvas {...defaultProps} />);

    expect(screen.getByText('9 un')).toBeInTheDocument();
    expect(screen.getByText('123 fl')).toBeInTheDocument();
    expect(screen.getByText('1000')).toBeInTheDocument();
    expect(screen.getByText('Aproveitamento')).toBeInTheDocument();
  });

  it('should show 90-degree rotation badge only when isRotated is true', () => {
    const { rerender } = render(<SheetCuttingCanvas {...defaultProps} isRotated={false} />);
    expect(screen.queryByText(/giro 90° otimizado/i)).not.toBeInTheDocument();

    rerender(<SheetCuttingCanvas {...defaultProps} isRotated={true} />);
    expect(screen.getByText(/giro 90° otimizado/i)).toBeInTheDocument();
  });

  it('should render SVG canvas with grid rectangles', () => {
    const { container } = render(<SheetCuttingCanvas {...defaultProps} />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();

    // Rectangles for sheet background, grip margins, and items
    const rects = container.querySelectorAll('svg rect');
    expect(rects.length).toBeGreaterThan(3);
  });
});
