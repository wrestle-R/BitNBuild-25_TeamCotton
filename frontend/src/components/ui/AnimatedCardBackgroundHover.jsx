import { AnimatedBackground } from '@/components/core/animated-background';

export function AnimatedCardBackgroundHover() {
  const ITEMS = [
    {
      id: 1,
      title: 'Collect Horses',
      description: 'Build your legendary stable.',
    },
    {
      id: 2,
      title: 'Master Lassos',
      description: 'Perfect your roping skills.',
    },
    {
      id: 3,
      title: 'Epic Duels',
      description: 'Challenge other cowboys.',
    },
    {
      id: 4,
      title: 'Legendary Hats',
      description: 'Earn iconic cowboy gear.',
    },
    {
      id: 5,
      title: 'Wild Tournaments',
      description: 'Compete in grand events.',
    },
    {
      id: 6,
      title: 'Build Your Ranch',
      description: 'Create your western empire.',
    },
  ];

  return (
    <div className='grid grid-cols-2 p-10 md:grid-cols-3'>
      <AnimatedBackground
        className='rounded-lg bg-muted dark:bg-card'
        transition={{
          type: 'spring',
          bounce: 0.2,
          duration: 0.6,
        }}
        enableHover
      >
        {ITEMS.map((item, index) => (
          <div key={index} data-id={`card-${index}`}>
            <div className='flex select-none flex-col space-y-1 p-4'>
              <h3 className='text-base font-medium text-foreground'>
                {item.title}
              </h3>
              <p className='text-base text-muted-foreground'>
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </AnimatedBackground>
    </div>
  );
}