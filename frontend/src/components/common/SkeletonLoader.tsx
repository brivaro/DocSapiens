import { clsx } from 'clsx';

interface SkeletonLoaderProps {
    className?: string;
}

const SkeletonLoader = ({ className }: SkeletonLoaderProps) => {
    return (
        <div className={clsx(
            'bg-gray-700 rounded-md animate-shimmer',
            className
        )} />
    );
};

export default SkeletonLoader;