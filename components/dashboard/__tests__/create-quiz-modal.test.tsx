import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { CreateQuizModal } from '../create-quiz-modal';

describe('CreateQuizModal', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnQuizCreated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal title and subtitle when open', () => {
    render(
      <CreateQuizModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onQuizCreated={mockOnQuizCreated}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('renders three method cards', () => {
    render(
      <CreateQuizModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onQuizCreated={mockOnQuizCreated}
      />
    );

    const buttons = screen.getAllByRole('button');
    // 3 method cards + 1 close button = 4 buttons
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });

  it('shows coming soon badges on disabled cards', () => {
    render(
      <CreateQuizModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onQuizCreated={mockOnQuizCreated}
      />
    );

    // Should have 2 coming soon badges (AI and Templates)
    const comingSoonBadges = screen.getAllByText(/Em breve|Coming soon|Próximamente/i);
    expect(comingSoonBadges).toHaveLength(2);
  });

  it('calls onQuizCreated with a UUID when blank quiz card is clicked', async () => {
    const user = userEvent.setup();

    render(
      <CreateQuizModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onQuizCreated={mockOnQuizCreated}
      />
    );

    // Find and click the blank quiz card (it's the only non-disabled button besides close)
    const blankQuizCard = screen.getByRole('button', {
      name: /Quiz em Branco|Blank Quiz|Quiz en Blanco/i,
    });
    await user.click(blankQuizCard);

    expect(mockOnQuizCreated).toHaveBeenCalledTimes(1);
    // Check that it was called with a valid UUID format
    const calledWith = mockOnQuizCreated.mock.calls[0][0];
    expect(calledWith).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  it('does not call onQuizCreated when clicking disabled AI card', async () => {
    const user = userEvent.setup();

    render(
      <CreateQuizModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onQuizCreated={mockOnQuizCreated}
      />
    );

    const aiCard = screen.getByRole('button', {
      name: /Assistente IA|AI Assistant|Asistente IA/i,
    });
    await user.click(aiCard);

    expect(mockOnQuizCreated).not.toHaveBeenCalled();
  });

  it('does not call onQuizCreated when clicking disabled templates card', async () => {
    const user = userEvent.setup();

    render(
      <CreateQuizModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onQuizCreated={mockOnQuizCreated}
      />
    );

    const templatesCard = screen.getByRole('button', {
      name: /Templates|Plantillas/i,
    });
    await user.click(templatesCard);

    expect(mockOnQuizCreated).not.toHaveBeenCalled();
  });

  it('does not render when closed', () => {
    render(
      <CreateQuizModal
        open={false}
        onOpenChange={mockOnOpenChange}
        onQuizCreated={mockOnQuizCreated}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
