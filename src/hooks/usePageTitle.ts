import { useEffect } from 'react';

export function usePageTitle(title: string) {
  useEffect(() => {
    const storeName = localStorage.getItem('shaheen_store_name') || 'Shaheen Global Traders';
    document.title = `${title} | ${storeName}`;
  }, [title]);
}
