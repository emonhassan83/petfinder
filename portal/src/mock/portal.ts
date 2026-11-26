//* Mock data for portal screens whose APIs arrive in Phase 3.
export const mockNotifications = [
  { id: "n1", title: "Application approved", body: "Your application for Bella was approved. Message the shelter to arrange a visit.", time: "2h ago", unread: true },
  { id: "n2", title: "New message", body: "Happy Paws Shelter replied to your question about Max.", time: "5h ago", unread: true },
  { id: "n3", title: "Listing update", body: "A pet you saved, Luna, now has new photos.", time: "Yesterday", unread: false },
];

export const mockConversations = [
  {
    id: "c1",
    with: "Happy Paws Shelter",
    verified: true,
    pet: "Bella",
    messages: [
      { from: "them", text: "Hi! Thanks for applying to adopt Bella." },
      { from: "me", text: "Thank you! Is she good with other dogs?" },
      { from: "them", text: "Yes, very social. Would Saturday work for a visit?" },
    ],
  },
  {
    id: "c2",
    with: "Rina (owner)",
    verified: false,
    pet: "Max",
    messages: [{ from: "them", text: "Max is fully vaccinated and microchipped." }],
  },
];
