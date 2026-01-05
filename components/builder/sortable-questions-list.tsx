'use client';

import { useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
  type DropAnimation,
  MeasuringStrategy,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ImageIcon, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Question } from '@/types';
import {
  SidebarCard,
  SidebarCardActionTrigger,
  SidebarCardDragHandle,
} from '@/components/builder/sidebar-card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LoadingCard } from '@/components/ui/loading-card';

interface SortableQuestionsListProps {
  questions: Partial<Question>[];
  isLoading?: boolean;
  onReorder: (sourceIndex: number, destinationIndex: number) => void;
  onEdit: (questionId: string) => void;
  onDelete: (questionId: string) => void;
  onAdd: () => void;
}

interface SortableQuestionItemProps {
  question: Partial<Question>;
  index: number;
  isLoading?: boolean;
  isDragging?: boolean;
  onEdit: (questionId: string) => void;
  onDelete: (questionId: string) => void;
}

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
};

function QuestionCardContent({
  question,
  index,
  isDragging = false,
  isOverlay = false,
}: {
  question: Partial<Question>;
  index: number;
  isDragging?: boolean;
  isOverlay?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-4',
        isDragging && !isOverlay && 'opacity-0'
      )}
    >
      <div className="relative h-14 w-14 flex-shrink-0">
        <div className="h-full w-full overflow-hidden rounded-2xl border border-border bg-muted/60">
          {question.imageUrl ? (
            <img
              src={question.imageUrl}
              alt="Imagem da pergunta"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ImageIcon className="h-5 w-5" aria-hidden="true" />
            </div>
          )}
        </div>
        <span className="absolute -top-1.5 -right-1.5 flex h-6 min-w-6 items-center justify-center rounded-full border border-border bg-primary px-2 text-xs font-semibold text-primary-foreground shadow-sm">
          {index + 1}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">
          {question.text || 'Pergunta sem texto'}
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {(question.options?.length ?? 0)} opções
        </p>
      </div>
    </div>
  );
}

function SortableQuestionItem({
  question,
  index,
  isLoading = false,
  isDragging = false,
  onEdit,
  onDelete,
}: SortableQuestionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: question.id || `question-${index}`,
    transition: {
      duration: 200,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
  };

  const isCurrentlyDragging = isDragging || isSortableDragging;

  return (
    <LoadingCard isLoading={isLoading}>
      <div ref={setNodeRef} style={style} className="relative group">
        {/* Drag handle - always visible when multiple questions exist */}
        <SidebarCardDragHandle
          {...attributes}
          {...listeners}
          aria-label="Reordenar pergunta"
          isDragging={isCurrentlyDragging}
          className="touch-none select-none"
        >
          <GripVertical className="h-5 w-5" aria-hidden="true" />
        </SidebarCardDragHandle>

        <SidebarCard
          onClick={() => question.id && onEdit(question.id)}
          withActionPadding
          isDragging={isCurrentlyDragging}
          className={cn(
            isCurrentlyDragging && 'ring-2 ring-primary ring-offset-2'
          )}
        >
          <QuestionCardContent
            question={question}
            index={index}
            isDragging={isCurrentlyDragging}
          />
        </SidebarCard>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarCardActionTrigger
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
              aria-label="Opções da pergunta"
              className="absolute right-3 top-3"
            >
              <MoreVertical className="h-4 w-4" aria-hidden="true" />
            </SidebarCardActionTrigger>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                if (question.id) onEdit(question.id);
              }}
            >
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={(event) => {
                event.preventDefault();
                if (question.id) onDelete(question.id);
              }}
            >
              Deletar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </LoadingCard>
  );
}

function DragOverlayContent({
  question,
  index,
}: {
  question: Partial<Question>;
  index: number;
}) {
  return (
    <div className="relative group cursor-grabbing">
      <SidebarCardDragHandle isDragging className="touch-none select-none">
        <GripVertical className="h-5 w-5" aria-hidden="true" />
      </SidebarCardDragHandle>

      <SidebarCard
        withActionPadding
        isDragging
        className="ring-2 ring-primary ring-offset-2 shadow-xl"
      >
        <QuestionCardContent question={question} index={index} isOverlay />
      </SidebarCard>
    </div>
  );
}

export function SortableQuestionsList({
  questions,
  isLoading = false,
  onReorder,
  onEdit,
  onDelete,
  onAdd,
}: SortableQuestionsListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Create stable IDs for sortable context
  const questionIds = useMemo(
    () => questions.map((q, i) => q.id || `question-${i}`),
    [questions]
  );

  const activeQuestion = useMemo(() => {
    if (!activeId) return null;
    const index = questions.findIndex(
      (q, i) => (q.id || `question-${i}`) === activeId
    );
    return index >= 0 ? { question: questions[index], index } : null;
  }, [activeId, questions]);

  // Configure sensors for better UX across all devices
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // Small distance threshold prevents accidental drags when clicking
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        // Delay prevents accidental drags when scrolling on touch devices
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = questionIds.indexOf(active.id as string);
      const newIndex = questionIds.indexOf(over.id as string);

      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(oldIndex, newIndex);
      }
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  if (questions.length === 0) {
    return (
      <button
        type="button"
        onClick={onAdd}
        className="w-full rounded-2xl border border-dashed border-border/60 p-6 text-center text-xs text-muted-foreground transition hover:border-border/80 hover:bg-muted/40 cursor-[var(--cursor-interactive)]"
        aria-label="Adicionar primeira pergunta do quiz"
      >
        Adicione a primeira pergunta do quiz
      </button>
    );
  }

  // Only enable DnD if there's more than one question
  const canReorder = questions.length > 1;

  if (!canReorder) {
    // Single question - no DnD context needed
    return (
      <div className="space-y-3">
        {questions.map((question, index) => (
          <SortableQuestionItem
            key={question.id || `question-${index}`}
            question={question}
            index={index}
            isLoading={isLoading}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
    >
      <SortableContext items={questionIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {questions.map((question, index) => (
            <SortableQuestionItem
              key={question.id || `question-${index}`}
              question={question}
              index={index}
              isLoading={isLoading}
              isDragging={activeId === (question.id || `question-${index}`)}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>

      {/* Drag Overlay - renders the dragged item outside the normal flow */}
      <DragOverlay dropAnimation={dropAnimation}>
        {activeQuestion ? (
          <DragOverlayContent
            question={activeQuestion.question}
            index={activeQuestion.index}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

