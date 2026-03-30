import { Link } from 'react-router-dom';
import { useInView } from '../lib/useInView';
import NavHeader from '../components/NavHeader';
import PageTitle from '../components/PageTitle';

function FadeIn({ children, className = '', delay = 0 }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function SlideIn({ children, className = '', direction = 'left', delay = 0 }) {
  const [ref, inView] = useInView();
  const from = direction === 'left' ? '-translate-x-12' : 'translate-x-12';
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${inView ? 'opacity-100 translate-x-0' : `opacity-0 ${from}`} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

const STEPS = [
  { emoji: '✨', title: 'Create an event', desc: 'The host sets up a wedding prop bet event in seconds and gets a shareable invite link.' },
  { emoji: '📱', title: 'Guests place their bets', desc: 'Guests open the link on their phone and answer a series of yes/no, over/under, and multiple choice questions about the wedding.' },
  { emoji: '⚡', title: 'Live scoring', desc: 'As the wedding unfolds, the host marks the real outcomes. Everyone\'s scores update in real time.' },
  { emoji: '🏆', title: 'Crown a winner', desc: 'The leaderboard ranks everyone by points. Tied? A Price is Right–style tie breaker settles it.' },
];

const SAMPLE_QUESTIONS = [
  { q: 'Will there be a neon sign?', type: 'Yes / No' },
  { q: 'Will the best man speech be over 5.5 minutes?', type: 'Over / Under' },
  { q: 'What will the cake flavor be?', type: 'Multiple choice' },
  { q: 'Will Mr. Brightside be played?', type: 'Yes / No' },
  { q: 'Will the bride do a dress change?', type: 'Yes / No' },
];

export default function About() {
  return (
    <div className="min-h-screen bg-surface text-gray-800">
      <PageTitle title="How it works" />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-brand-800)_0%,_transparent_50%)] opacity-60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--color-accent-500)_0%,_transparent_40%)] opacity-10" />
        <NavHeader variant="dark" />
        <div className="relative z-10 max-w-2xl mx-auto px-6 py-20 sm:py-28 text-center">
          <FadeIn delay={100}>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-5 tracking-tight leading-[1.15]">
              Weddings are fun.<br />
              <span className="text-accent-400">Betting on them is better.</span>
            </h1>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="text-brand-300 text-lg sm:text-xl max-w-lg mx-auto leading-relaxed">
              Wedding prop bets turns every reception into a live, interactive game that your guests will actually remember.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Origin story */}
      <section className="px-6 py-20 sm:py-28">
        <div className="max-w-2xl mx-auto">
          <FadeIn>
            <p className="text-xs font-semibold text-brand-500 uppercase tracking-widest mb-4">The backstory</p>
          </FadeIn>
          <FadeIn delay={100}>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-8 leading-snug">
              It started at a wedding.<br />Obviously.
            </h2>
          </FadeIn>
          <div className="space-y-6 text-gray-600 text-lg leading-relaxed">
            <FadeIn delay={150}>
              <p>
                We were attending a lot of weddings — the kind of year where your weekends disappear and your suit gets dry-cleaned more than your jeans. Somewhere between the cocktail hour and the bouquet toss, someone had the idea: <em className="text-gray-800 font-medium">what if we made this interesting?</em>
              </p>
            </FadeIn>
            <FadeIn delay={200}>
              <p>
                So we started betting. Not on anything serious — just the little things. Will there be a neon sign? Is the best man going to talk for 10 minutes? Will someone request Mr. Brightside? It was a Google Form at first. Scrappy. Manual. Someone had to tally scores in a spreadsheet while also trying to enjoy the open bar.
              </p>
            </FadeIn>
            <FadeIn delay={250}>
              <p>
                But it worked. People loved it. The group chat lit up. People who barely knew each other were suddenly rooting for the bouquet toss together. The quiet table in the corner got competitive. It turned every wedding from something you attend into something you <em className="text-gray-800 font-medium">play</em>.
              </p>
            </FadeIn>
            <FadeIn delay={300}>
              <p className="text-gray-800 font-semibold">
                So we built this — a real app that does what the Google Form never could: live scoring, instant leaderboards, real-time updates, and zero spreadsheets.
              </p>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 sm:py-28 bg-white">
        <div className="max-w-3xl mx-auto">
          <FadeIn>
            <p className="text-xs font-semibold text-brand-500 uppercase tracking-widest mb-4 text-center">How it works</p>
          </FadeIn>
          <FadeIn delay={100}>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-16 text-center">Four steps, zero spreadsheets</h2>
          </FadeIn>
          <div className="space-y-12">
            {STEPS.map((step, i) => (
              <SlideIn key={i} direction={i % 2 === 0 ? 'left' : 'right'} delay={i * 80}>
                <div className="flex items-start gap-5">
                  <div className="shrink-0 w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center text-2xl">
                    {step.emoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">Step {i + 1}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{step.title}</h3>
                    <p className="text-gray-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </SlideIn>
            ))}
          </div>
        </div>
      </section>

      {/* Sample questions */}
      <section className="px-6 py-20 sm:py-28">
        <div className="max-w-2xl mx-auto">
          <FadeIn>
            <p className="text-xs font-semibold text-brand-500 uppercase tracking-widest mb-4 text-center">Sample questions</p>
          </FadeIn>
          <FadeIn delay={100}>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-12 text-center">The kind of stuff you'll bet on</h2>
          </FadeIn>
          <div className="space-y-3">
            {SAMPLE_QUESTIONS.map((sq, i) => (
              <FadeIn key={i} delay={i * 60}>
                <div className="bg-white rounded-2xl p-5 shadow-sm shadow-gray-900/[0.04] flex items-center justify-between gap-4">
                  <p className="text-gray-800 font-medium">{sq.q}</p>
                  <span className="text-xs font-semibold text-brand-500 bg-brand-100 px-3 py-1 rounded-full whitespace-nowrap">{sq.type}</span>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Rules */}
      <section className="px-6 py-20 sm:py-28 bg-white">
        <div className="max-w-2xl mx-auto">
          <FadeIn>
            <p className="text-xs font-semibold text-brand-500 uppercase tracking-widest mb-4 text-center">The rules</p>
          </FadeIn>
          <FadeIn delay={100}>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-12 text-center">Simple enough to explain between toasts</h2>
          </FadeIn>
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              { icon: '📝', title: 'One submission', text: 'You get one shot. Once you submit your answers, they\'re locked in — no edits, no second-guessing.' },
              { icon: '🎯', title: 'One point each', text: 'There are 12 scored questions. Each correct answer earns one point. That\'s it.' },
              { icon: '⏱️', title: 'Tie breaker', text: 'If two players tie on points, the tie breaker kicks in: closest guess to the actual time the bride leaves the after party. Price is Right rules — you can\'t go under.' },
              { icon: '👑', title: 'Winner takes all', text: 'Highest score wins. If there\'s still a tie after the tie breaker, the host makes the final call.' },
              { icon: '📊', title: 'Live updates', text: 'As the host scores each question during the wedding, your dashboard updates in real time. Watch the leaderboard shift.' },
              { icon: '🔒', title: 'No peeking', text: 'You can only see the dashboard after you\'ve submitted your own answers. No copying.' },
            ].map((rule, i) => (
              <FadeIn key={i} delay={i * 60}>
                <div className="bg-surface rounded-2xl p-5 border border-gray-100">
                  <span className="text-2xl block mb-3">{rule.icon}</span>
                  <h3 className="font-bold text-gray-800 mb-1">{rule.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{rule.text}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 px-6 py-24 sm:py-32 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--color-accent-500)_0%,_transparent_40%)] opacity-10" />
        <div className="relative z-10 max-w-lg mx-auto">
          <FadeIn>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5 tracking-tight">Ready to make your wedding unforgettable?</h2>
          </FadeIn>
          <FadeIn delay={100}>
            <p className="text-brand-300 text-lg mb-10">Set up takes less than a minute. Your guests will thank you.</p>
          </FadeIn>
          <FadeIn delay={200}>
            <Link
              to="/admin/create"
              className="inline-block bg-white text-brand-700 px-10 py-4 rounded-2xl text-lg font-bold hover:bg-accent-100 hover:text-accent-500 transition-all duration-200 shadow-xl shadow-black/20 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
            >
              Create new event
            </Link>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
