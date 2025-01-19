// components/hero.tsx
export default function Hero() {
  return (
    <div className="pt-4 flex flex-col gap-16 items-center">
      <div className="text-center">
        <h1 className="text-4xl lg:text-5xl font-bold mb-6">
          Your AI Chat Assistant
        </h1>
        <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
          Experience intelligent conversations with AI, featuring advanced
          message editing and conversation branching.
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
        <FeatureCard
          title="Smart Chat"
          description="Engage in natural conversations powered by advanced AI"
          icon="💭"
        />
        <FeatureCard
          title="Edit & Branch"
          description="Modify messages and explore different conversation paths"
          icon="🌳"
        />
        <FeatureCard
          title="History"
          description="Keep track of all your conversations and their variations"
          icon="📝"
        />
      </div>

      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="p-6 rounded-lg border border-foreground/10 hover:border-foreground/20 transition-colors">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
