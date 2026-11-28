"use client";

import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import ChatInbox from "@/components/Chat/ChatInbox";

const MessagesPage = () => {
  //* `?c=<conversationId>` preselects a thread (set by "Message" on a pet page)
  const [initialId, setInitialId] = useState<string | undefined>();
  useEffect(() => {
    setInitialId(new URLSearchParams(window.location.search).get("c") || undefined);
  }, []);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Messages
      </Typography>
      <ChatInbox initialConversationId={initialId} />
    </Box>
  );
};

export default MessagesPage;
