import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFoundView() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950 p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-8 md:p-12 shadow-xl max-w-lg w-full text-center flex flex-col items-center gap-6"
      >
        <motion.div 
          initial={{ rotate: -20, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center shrink-0"
        >
          <AlertCircle size={40} />
        </motion.div>
        <div className="flex flex-col gap-2">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl md:text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight"
          >
            404
          </motion.h1>
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl font-bold text-slate-700 dark:text-slate-300"
          >
            Page not found
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-slate-500 dark:text-slate-400 mt-2"
          >
            The page you're looking for doesn't exist, has been moved, or you don't have permission to view it.
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link 
            to="/" 
            className="mt-4 flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md shadow-blue-500/20"
          >
            <Home size={18} />
            Back to Home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
