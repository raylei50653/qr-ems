import { render, screen } from '@testing-library/react';
import { EquipmentStatusBadge } from './EquipmentStatusBadge';
import { describe, it, expect } from 'vitest';

describe('EquipmentStatusBadge', () => {
    it('renders correct label for AVAILABLE status', () => {
        render(<EquipmentStatusBadge status="AVAILABLE" />);
        expect(screen.getByText('可借用')).toBeInTheDocument();
        // Check for green style
        const badge = screen.getByText('可借用');
        expect(badge).toHaveClass('bg-green-100');
    });

    it('renders correct label for BORROWED status', () => {
        render(<EquipmentStatusBadge status="BORROWED" />);
        expect(screen.getByText('已借出')).toBeInTheDocument();
        const badge = screen.getByText('已借出');
        expect(badge).toHaveClass('bg-blue-100');
    });

    it('renders raw status if unknown', () => {
        render(<EquipmentStatusBadge status="UNKNOWN_STATUS" />);
        expect(screen.getByText('UNKNOWN_STATUS')).toBeInTheDocument();
    });
});
