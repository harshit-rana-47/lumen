import { ChatWindow } from "@/components/chat/ChatWindow";

export default function ChatPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Chat</h1>
        <p className="mt-1 text-sm text-slate-500">Talk with Lumen using your private journal context.</p>
      </div>
      <ChatWindow />
    </div>
  );
}
