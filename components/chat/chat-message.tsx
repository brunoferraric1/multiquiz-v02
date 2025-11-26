import { type ChatMessage } from '@/types';
import { User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useMemo } from 'react';

interface ChatMessageProps {
  message: ChatMessage;
}

// Configure marked options
marked.setOptions({
  breaks: true, // Convert \n to <br>
  gfm: true, // GitHub Flavored Markdown
});

export function ChatMessageComponent({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const timestamp = new Date(message.timestamp).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Parse and sanitize markdown content
  const htmlContent = useMemo(() => {
    if (isUser) {
      // Don't parse markdown for user messages, just preserve line breaks
      return message.content.replace(/\n/g, '<br>');
    }
    // Parse markdown for AI messages
    const rawHtml = marked.parse(message.content, { async: false }) as string;
    return DOMPurify.sanitize(rawHtml);
  }, [message.content, isUser]);

  return (
    <div
      className={cn(
        'flex gap-3 p-4 rounded-lg',
        isUser ? 'bg-primary/10' : 'bg-muted/50'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        )}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-medium">
            {isUser ? 'Você' : 'IA'}
          </span>
          <span className="text-xs text-muted-foreground">
            {timestamp}
          </span>
        </div>
        <div
          className="text-sm break-words prose prose-sm max-w-none dark:prose-invert prose-p:my-2 prose-strong:font-semibold prose-strong:text-primary prose-ul:list-disc prose-ol:list-decimal prose-ul:pl-4 prose-ol:pl-4 prose-li:my-1 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-4 [&_ol]:pl-4 [&_li]:my-1"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </div>
  );
}
