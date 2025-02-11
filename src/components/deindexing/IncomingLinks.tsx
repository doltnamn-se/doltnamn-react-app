import { useLanguage } from "@/contexts/LanguageContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusStepper } from "./StatusStepper";
import { useIncomingUrls } from "@/hooks/useIncomingUrls";
import { Link2 } from "lucide-react";

export const IncomingLinks = () => {
  const { t, language } = useLanguage();
  const { incomingUrls, isLoading } = useIncomingUrls();

  // Sort URLs by creation date (newest first)
  const sortedUrls = incomingUrls?.sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  console.log('Incoming URLs with status history:', sortedUrls?.map(url => ({
    id: url.id,
    status: url.status,
    statusHistory: url.status_history,
    createdAt: url.created_at
  })));

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  if (!sortedUrls?.length) {
    return (
      <p className="text-[#000000A6] dark:text-[#FFFFFFA6] text-sm font-medium">
        {t('deindexing.no.incoming.links')}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[250px] h-14">{t('deindexing.url')}</TableHead>
            <TableHead className="h-14">{language === 'sv' ? 'Status' : 'Status'}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedUrls.map((url) => (
            <TableRow key={url.id} className="hover:bg-transparent">
              <TableCell className="font-medium w-[250px] max-w-[250px] py-6">
                <a 
                  href={url.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-xs text-[#000000A6] dark:text-[#FFFFFFA6] hover:text-[#000000] dark:hover:text-white truncate block flex items-center gap-2"
                  title={url.url}
                >
                  <Link2 className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{url.url}</span>
                </a>
              </TableCell>
              <TableCell className="py-6">
                <StatusStepper 
                  currentStatus={url.status} 
                  statusHistory={url.status_history}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};