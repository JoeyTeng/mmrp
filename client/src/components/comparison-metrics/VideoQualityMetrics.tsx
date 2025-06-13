const VideoQualityMetrics = () => {
    return (
        <div className='w-full h-full flex flex-col text-center'>
            <div className='flex-1 flex items-center justify-between'>
                <span className='text-sm font-medium'>PSNR</span>
                <span className='text-sm text-gray-600'>37.42 dB</span>
            </div>
            <div className='flex-1 flex items-center justify-between'>
                <span className='text-sm font-medium'>SSIM</span>
                <span className='text-sm text-gray-600'>0.945</span>
            </div>
            <div className='flex-1 flex items-center justify-between'>
                <span className='text-sm font-medium'>VMAF</span>
                <span className='text-sm text-gray-600'>92.6</span>
            </div>
            <div className='flex-1 flex items-center justify-between'>
                <span className='text-sm font-medium'>NIQE</span>
                <span className='text-sm text-gray-600'>4.3</span>
            </div>
            <div className='flex-1 flex items-center justify-between'>
                <span className='text-sm font-medium'>WVQA</span>
                <span className='text-sm text-gray-600'>78.1</span>
            </div>
        </div>
    );
};

export default VideoQualityMetrics;