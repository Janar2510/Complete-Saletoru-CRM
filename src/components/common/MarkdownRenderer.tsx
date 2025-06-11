import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  // Process @mentions to highlight them
  const processedContent = content.replace(/@(\w+)/g, '**@$1**');

  return (
    <div className={`markdown-content text-dark-300 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
          a: ({ node, ...props }) => <a className="text-accent hover:underline" {...props} />,
          strong: ({ node, ...props }) => {
            const text = props.children?.toString() || '';
            if (text.startsWith('@')) {
              return <span className="text-purple-400 font-medium">{text}</span>;
            }
            return <strong className="font-semibold text-white" {...props} />;
          },
          ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2" {...props} />,
          li: ({ node, ...props }) => <li className="mb-1" {...props} />,
          h1: ({ node, ...props }) => <h1 className="text-xl font-bold text-white mt-4 mb-2" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-lg font-bold text-white mt-3 mb-2" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-md font-bold text-white mt-3 mb-1" {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-dark-300 pl-4 italic my-2" {...props} />
          ),
          code: ({ node, inline, ...props }) => 
            inline ? (
              <code className="bg-dark-300/30 px-1 py-0.5 rounded text-white font-mono text-sm" {...props} />
            ) : (
              <code className="block bg-dark-300/30 p-3 rounded font-mono text-sm overflow-x-auto my-2" {...props} />
            ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};