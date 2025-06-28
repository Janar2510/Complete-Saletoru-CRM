import React from "react";
import { Sparkles } from "lucide-react";
import { Card } from "../common/Card";

export const TaskGeneratorModal: React.FC = () => {
  // This can be wired to open when a button is clicked
  return (
    <Card className="p-4 border border-dark-200/50 bg-dark-100 text-white max-w-lg mx-auto">
      <div className="flex items-center mb-4">
        <Sparkles className="text-yellow-400 w-6 h-6 mr-2" />
        <h3 className="text-xl font-semibold">AI Task Generator</h3>
      </div>
      <p className="text-sm text-dark-100 mb-3">
        Describe what needs to be done, and our AI will generate the task details.
      </p>
      <textarea
        placeholder="E.g. Follow up with lead about pricing options..."
        className="w-full p-2 rounded bg-dark-200 text-white border border-dark-300 resize-none mb-3"
        rows={4}
      />
      <button className="bg-gradient-to-r from-accent to-purple-600 text-white py-2 px-4 rounded hover:opacity-90 transition">
        Generate Task
      </button>
    </Card>
  );
};
