'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    MoreVertical,
    Share2,
    Trash2,
    Edit,
    Check,
    LineChart,
    Globe,
    GlobeLock,
    Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BottomDrawer } from '@/components/ui/bottom-drawer';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { copyToClipboard } from '@/lib/copy-to-clipboard';
import { QuizService } from '@/lib/services/quiz-service';
import { useAuth } from '@/lib/hooks/use-auth';
import { useQueryClient } from '@tanstack/react-query';
import { useLocale, useMessages } from '@/lib/i18n/context';
import { localizePathname } from '@/lib/i18n/paths';
import { PublishSuccessDrawer } from '@/components/dashboard/publish-success-drawer';
import { UpgradeModal } from '@/components/upgrade-modal';
import type { Quiz } from '@/types';

interface QuizActionMenuProps {
    quiz: Quiz;
    onDelete: (id: string) => Promise<void>;
    isDeleting?: boolean;
}

export function QuizActionMenu({ quiz, onDelete, isDeleting = false }: QuizActionMenuProps) {
    const router = useRouter();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showUnpublishDialog, setShowUnpublishDialog] = useState(false);
    const [isDeletingInternal, setIsDeletingInternal] = useState(false);
    const [isUnpublishing, setIsUnpublishing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [upgradeModalState, setUpgradeModalState] = useState<{
        open: boolean;
        reason: 'draft-limit' | 'publish-limit' | 'brand-kit';
    }>({ open: false, reason: 'publish-limit' });
    const locale = useLocale();
    const messages = useMessages();
    const dashboard = messages.dashboard;
    const common = messages.common;

    const handleCopyLink = async () => {
        if (!quiz.isPublished || !quiz.id) return;
        const url = typeof window !== 'undefined'
            ? `${window.location.origin}${localizePathname(`/quiz/${quiz.id}`, locale)}`
            : '';
        if (!url) return;

        const success = await copyToClipboard(url);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } else {
            toast.error(dashboard.quizActions.linkCopyError);
        }
    };

    const handleDeleteConfirm = async () => {
        setIsDeletingInternal(true);
        try {
            await onDelete(quiz.id);
            setShowDeleteDialog(false);
        } catch (error) {
            console.error('Delete failed', error);
            setIsDeletingInternal(false);
        }
    };

    const handleEdit = () => {
        setMobileMenuOpen(false);
        router.push(localizePathname(`/visual-builder/${quiz.id}`, locale));
    };

    const handleReports = () => {
        setMobileMenuOpen(false);
        router.push(localizePathname(`/dashboard/reports/${quiz.id}`, locale));
    };

    const handleCopyLinkAndClose = async () => {
        await handleCopyLink();
        setMobileMenuOpen(false);
    };

    const handleDeleteClick = () => {
        setMobileMenuOpen(false);
        setShowDeleteDialog(true);
    };

    const handlePublish = async () => {
        console.log('[QuizActionMenu] handlePublish called', { user: !!user, quizId: quiz.id, isPublishing });
        if (!user) {
            console.error('[QuizActionMenu] No user available');
            return;
        }
        if (!quiz.id) {
            console.error('[QuizActionMenu] No quiz ID');
            return;
        }
        if (isPublishing) {
            console.log('[QuizActionMenu] Already publishing');
            return;
        }
        setIsPublishing(true);
        try {
            const result = await QuizService.publishQuiz(quiz.id, user.uid);
            if (result.status === 'limit-reached') {
                toast.error(dashboard.toast.publishLimit);
                setMobileMenuOpen(false);
                setUpgradeModalState({ open: true, reason: 'publish-limit' });
                return;
            }
            setMobileMenuOpen(false);
            // Show the success modal immediately
            setShowPublishModal(true);
            // Invalidate cache to update UI (background)
            queryClient.invalidateQueries({ queryKey: ['quiz', quiz.id] });
            queryClient.invalidateQueries({ queryKey: ['quizzes', user.uid] });
        } catch (error) {
            console.error('Publish failed', error);
            toast.error(dashboard.toast.publishError);
        } finally {
            setIsPublishing(false);
        }
    };

    const handleUnpublishClick = () => {
        setMobileMenuOpen(false);
        setShowUnpublishDialog(true);
    };

    const handleUnpublishConfirm = async () => {
        if (!user || !quiz.id || isUnpublishing) return;
        setIsUnpublishing(true);
        try {
            await QuizService.unpublishQuiz(quiz.id, user.uid);
            setShowUnpublishDialog(false);
            // Invalidate cache to update UI
            queryClient.invalidateQueries({ queryKey: ['quiz', quiz.id] });
            queryClient.invalidateQueries({ queryKey: ['quizzes', user.uid] });
        } catch (error) {
            console.error('Unpublish failed', error);
        } finally {
            setIsUnpublishing(false);
        }
    };

    // Menu items component for reusability
    const MenuItems = ({ isMobile = false }: { isMobile?: boolean }) => {
        const itemClass = isMobile
            ? "flex items-center gap-4 px-6 py-4 text-base active:bg-accent transition-colors cursor-pointer"
            : "";
        const iconSize = isMobile ? 20 : 16;

        return (
            <>
                {isMobile ? (
                    <>
                        <button onClick={handleEdit} className={itemClass}>
                            <Edit size={iconSize} />
                            <span>{common.buttons.edit}</span>
                        </button>
                        <button onClick={handleReports} className={itemClass}>
                            <LineChart size={iconSize} />
                            <span>{dashboard.quizActions.viewReport}</span>
                        </button>
                        <div className="h-px bg-border my-2" />
                        {quiz.isPublished ? (
                            <button
                                onClick={handleUnpublishClick}
                                className={`${itemClass} text-orange-500`}
                            >
                                <GlobeLock size={iconSize} />
                                <span>{dashboard.quizActions.unpublish}</span>
                            </button>
                        ) : (
                            <button
                                onClick={handlePublish}
                                disabled={isPublishing}
                                className={`${itemClass} text-green-500 ${isPublishing ? 'opacity-50' : ''}`}
                            >
                                <Globe size={iconSize} />
                                <span>
                                    {isPublishing ? common.buttons.publishing : common.buttons.publish}
                                </span>
                            </button>
                        )}
                        <button
                            onClick={handleCopyLinkAndClose}
                            disabled={!quiz.isPublished}
                            className={`${itemClass} ${!quiz.isPublished ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {copied ? (
                                <Check size={iconSize} className="text-green-600" />
                            ) : (
                                <Share2 size={iconSize} />
                            )}
                            <span>{copied ? dashboard.quizActions.linkCopied : dashboard.quizActions.copyLink}</span>
                        </button>
                        <div className="h-px bg-border my-2" />
                        <button
                            onClick={handleDeleteClick}
                            className={`${itemClass} text-destructive`}
                        >
                            <Trash2 size={iconSize} />
                            <span>{common.buttons.delete}</span>
                        </button>
                    </>
                ) : (
                    <>
                        <DropdownMenuItem onClick={handleEdit}>
                            <Edit className="mr-2 h-4 w-4" />
                            {common.buttons.edit}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleReports}>
                            <LineChart className="mr-2 h-4 w-4" />
                            {dashboard.quizActions.viewReport}
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {quiz.isPublished ? (
                            <DropdownMenuItem
                                onClick={handleUnpublishClick}
                                className="text-orange-600 focus:text-orange-700 focus:bg-orange-100"
                            >
                                <GlobeLock className="mr-2 h-4 w-4" />
                                {dashboard.quizActions.unpublish}
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem
                                onClick={handlePublish}
                                disabled={isPublishing}
                                className="text-green-600 focus:text-green-700 focus:bg-green-100"
                            >
                                <Globe className="mr-2 h-4 w-4" />
                                {isPublishing ? common.buttons.publishing : common.buttons.publish}
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                            onClick={handleCopyLink}
                            disabled={!quiz.isPublished}
                            className={!quiz.isPublished ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                            {copied ? (
                                <Check className="mr-2 h-4 w-4 text-green-600" />
                            ) : (
                                <Share2 className="mr-2 h-4 w-4" />
                            )}
                            {copied ? dashboard.quizActions.linkCopied : dashboard.quizActions.copyLink}
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                            onClick={handleDeleteClick}
                            className="text-red-600 focus:text-red-600 focus:bg-red-100"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {common.buttons.delete}
                        </DropdownMenuItem>
                    </>
                )}
            </>
        );
    };

    return (
        <>
            {/* Desktop: Dropdown Menu */}
            <div className="hidden md:block">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">{common.aria.openMenu}</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{dashboard.quizActions.actions}</DropdownMenuLabel>
                        <MenuItems isMobile={false} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Mobile: Bottom Sheet */}
            <div className="md:hidden">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                        e.stopPropagation();
                        setMobileMenuOpen(true);
                    }}
                >
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">{common.aria.openMenu}</span>
                </Button>

                <BottomDrawer
                    open={mobileMenuOpen}
                    onClose={() => setMobileMenuOpen(false)}
                    title={dashboard.quizActions.actions}
                >
                    <div className="py-2">
                        <MenuItems isMobile={true} />
                    </div>
                </BottomDrawer>
            </div>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent onClick={(e) => e.stopPropagation()}>
                    <DialogHeader>
                        <DialogTitle>{dashboard.deleteDialog.title}</DialogTitle>
                        <DialogDescription>
                            {dashboard.deleteDialog.description}
                        </DialogDescription>
                        <p className="text-sm font-medium text-foreground">{quiz.title}</p>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteDialog(false)}
                            disabled={isDeleting || isDeletingInternal}
                        >
                            {common.buttons.cancel}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting || isDeletingInternal}
                        >
                            {isDeletingInternal ? dashboard.deleteDialog.confirming : common.buttons.delete}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showUnpublishDialog} onOpenChange={setShowUnpublishDialog}>
                <DialogContent onClick={(e) => e.stopPropagation()}>
                    <DialogHeader>
                        <DialogTitle>{dashboard.unpublishDialog.title}</DialogTitle>
                        <DialogDescription>
                            {dashboard.unpublishDialog.description}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                        <div className="shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                            <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="text-sm text-blue-700 dark:text-blue-300 pt-1">
                            {dashboard.unpublishDialog.dataNotice}
                        </p>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowUnpublishDialog(false)}
                            disabled={isUnpublishing}
                        >
                            {common.buttons.cancel}
                        </Button>
                        <Button
                            variant="default"
                            onClick={handleUnpublishConfirm}
                            disabled={isUnpublishing}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            {isUnpublishing ? dashboard.unpublishDialog.confirming : dashboard.unpublishDialog.confirm}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <PublishSuccessDrawer
                open={showPublishModal}
                onClose={() => setShowPublishModal(false)}
                quizId={quiz.id}
            />

            <UpgradeModal
                open={upgradeModalState.open}
                reason={upgradeModalState.reason}
                onOpenChange={(open) => setUpgradeModalState((prev) => ({ ...prev, open }))}
            />
        </>
    );
}
