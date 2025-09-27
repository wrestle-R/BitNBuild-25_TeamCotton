import { Spotlight } from '@/components/core/spotlight';

export function SpotlightCustomColor() {
  return (
    <div className='relative aspect-video h-[200px] rounded-sm border border-border bg-background dark:border-border dark:bg-card'>
      <Spotlight
        className='from-primary via-accent to-muted-foreground blur-xl'
        size={64}
      />
      <div className='absolute inset-0'>
        <svg className='h-full w-full'>
          <defs>
            <pattern
              id='grid-pattern'
              width='8'
              height='8'
              patternUnits='userSpaceOnUse'
            >
              <path
                xmlns='http://www.w3.org/2000/svg'
                d='M0 4H4M4 4V0M4 4H8M4 4V8'
                stroke='currentColor'
                strokeOpacity='0.3'
                className='stroke-foreground dark:stroke-card-foreground'
              />
              <rect
                x='3'
                y='3'
                width='2'
                height='2'
                fill='currentColor'
                fillOpacity='0.25'
                className='fill-foreground dark:fill-card-foreground'
              />
            </pattern>
          </defs>
          <rect width='100%' height='100%' fill='url(#grid-pattern)' />
        </svg>
      </div>
    </div>
  );
}