declare module 'react-quill' {
    import * as React from 'react';

    export interface ReactQuillProps {
        value?: string;
        onChange?: (content: string) => void;
        className?: string;
        theme?: string;
        modules?: {
            toolbar?: Array<Array<any>>;
            [key: string]: any;
        };
        [key: string]: any;
    }

    const ReactQuill: React.FC<ReactQuillProps>;
    export default ReactQuill;
} 