"use client";

import { Button } from "@mui/material";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useChatStartConversationMutation } from "@/redux/api/conversationApi";
import { dashboardPathForRole } from "@/services/actions/loginUsers";

type Props = { petId: string; ownerId?: string; label: string };

//* Opens (or reuses) the thread for this pet via POST /conversations, then jumps to the inbox
const MessageButton = ({ petId, ownerId, label }: Props) => {
  const { user } = useAuthUser();
  const router = useRouter();
  const pathname = usePathname();
  const [start, { isLoading }] = useChatStartConversationMutation();

  if (user && ownerId && user.userId === ownerId) return null;

  const onClick = async () => {
    if (!user) {
      toast.info("Log in to message the shelter");
      router.push(`/login?redirect=${encodeURIComponent(pathname || "/pets")}`);
      return;
    }
    if (petId.startsWith("preview-")) {
      toast.info("Preview listings cannot be messaged");
      return;
    }
    try {
      const conversation = await start({ petId }).unwrap();
      const inbox = user.role === "user" ? "/dashboard/user/messages" : `${dashboardPathForRole(user.role)}/messages`;
      router.push(`${inbox}?c=${conversation.id}`);
    } catch (err: any) {
      toast.error(err?.data?.message || "Could not start a conversation");
    }
  };

  return (
    <Button
      fullWidth
      variant="outlined"
      disabled={isLoading}
      onClick={onClick}
      startIcon={<ChatBubbleOutlineIcon fontSize="small" />}
      sx={{ mt: 1.5 }}
    >
      {label}
    </Button>
  );
};

export default MessageButton;
