
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Messages = () => {
  const [message, setMessage] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const { toast } = useToast();

  const handleWhatsAppMessage = () => {
    if (!message.trim()) {
      toast({
        title: "Message is empty",
        description: "Please enter a message to send",
        variant: "destructive",
      });
      return;
    }

    // Format the phone number and message for WhatsApp
    const formattedMessage = encodeURIComponent(message);
    // If phone number is provided, send to that number, otherwise open WhatsApp without a recipient
    const whatsappUrl = phoneNumber
      ? `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${formattedMessage}`
      : `https://web.whatsapp.com/send?text=${formattedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "Opening WhatsApp",
      description: "Redirecting to WhatsApp with your message",
    });
  };

  const handleSMSMessage = () => {
    if (!message.trim()) {
      toast({
        title: "Message is empty",
        description: "Please enter a message to send",
        variant: "destructive",
      });
      return;
    }

    // Format the message for SMS
    const formattedMessage = encodeURIComponent(message);
    // If phone number is provided, include it, otherwise just open with the message
    const smsUrl = phoneNumber 
      ? `sms:${phoneNumber}?body=${formattedMessage}`
      : `sms:?body=${formattedMessage}`;
    
    window.location.href = smsUrl;
    
    toast({
      title: "Opening SMS",
      description: "Opening your default messaging app",
    });
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>
      
      <Card className="bg-slate-800 text-white border-slate-700">
        <CardHeader>
          <CardTitle>Send Message</CardTitle>
          <CardDescription className="text-slate-400">
            Send messages to students or parents via WhatsApp or SMS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="phoneNumber" className="text-sm font-medium">
              Phone Number (optional)
            </label>
            <input
              id="phoneNumber"
              type="tel"
              placeholder="Enter phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full p-2 rounded-md bg-slate-700 border border-slate-600 text-white"
            />
            <p className="text-xs text-slate-400">
              If left empty, you'll need to select a contact in WhatsApp or your messaging app
            </p>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium">
              Message
            </label>
            <Textarea
              id="message"
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-32 bg-slate-700 border-slate-600 text-white"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={handleWhatsAppMessage}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Send via WhatsApp
            </Button>
            
            <Button 
              onClick={handleSMSMessage}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Send via SMS
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Messages;
