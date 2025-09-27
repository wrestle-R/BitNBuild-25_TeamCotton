import { motion } from 'framer-motion';
import { FaUsers, FaHorse, FaBullseye, FaGem } from 'react-icons/fa';
import { Card, CardContent } from '../ui/card';
import { AnimatedCardBackgroundHover } from '../ui/AnimatedCardBackgroundHover';

const ArenaSection = () => {
  return (
    <section id="arena" className="py-20 px-8 bg-background">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground font-montserrat mb-8">
            Enter the Arena
          </h2>
          <p className="text-lg text-muted-foreground font-inter mb-12 max-w-3xl mx-auto">
            Master various skills and compete with cowboys from around the world.
          </p>
        </motion.div>

        <AnimatedCardBackgroundHover />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <Card className="bg-primary text-primary-foreground p-6 border-border shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-0 text-center">
                <div className="flex items-center justify-center mb-2">
                  <FaUsers className="w-8 h-8 mr-2" />
                  <div className="text-3xl font-bold">10,000+</div>
                </div>
                <div className="font-inter">Active Cowboys</div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Card className="bg-primary text-primary-foreground p-6 border-border shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-0 text-center">
                <div className="flex items-center justify-center mb-2">
                  <FaHorse className="w-8 h-8 mr-2" />
                  <div className="text-3xl font-bold">500+</div>
                </div>
                <div className="font-inter">Unique Horses</div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <Card className="bg-primary text-primary-foreground p-6 border-border shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-0 text-center">
                <div className="flex items-center justify-center mb-2">
                  <FaBullseye className="w-8 h-8 mr-2" />
                  <div className="text-3xl font-bold">1M+</div>
                </div>
                <div className="font-inter">Lassos Thrown</div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <Card className="bg-primary text-primary-foreground p-6 border-border shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-0 text-center">
                <div className="flex items-center justify-center mb-2">
                  <FaGem className="w-8 h-8 mr-2" />
                  <div className="text-3xl font-bold">200+</div>
                </div>
                <div className="font-inter">Legendary Hats</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ArenaSection;