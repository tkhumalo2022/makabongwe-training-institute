"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import styles from "./admin.module.css";

type AssistantProps = {
  newEnquiries?: number | null;
  enrolmentsToReview?: number | null;
  paymentIssues?: number | null;
};

type Reply = {
  text: string;
  href?: string;
  linkLabel?: string;
};

const quickQuestions = [
  "What should I do first?",
  "Where are the learners?",
  "What does under review mean?",
  "How do I sign out?",
];

export function AdminAssistant({
  newEnquiries = null,
  enrolmentsToReview = null,
  paymentIssues = null,
}: AssistantProps) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [reply, setReply] = useState<Reply>({
    text: "Hi. I can explain this admin in simple steps. You can ask what to do next, where learner records are, what a status means, or how to safely sign out.",
  });

  const priorityReply = useMemo(() => {
    const tasks: string[] = [];
    if ((newEnquiries ?? 0) > 0) {
      tasks.push(`${newEnquiries} new enquiry${newEnquiries === 1 ? "" : "ies"}`);
    }
    if ((enrolmentsToReview ?? 0) > 0) {
      tasks.push(`${enrolmentsToReview} enrolment${enrolmentsToReview === 1 ? "" : "s"} to review`);
    }
    if ((paymentIssues ?? 0) > 0) {
      tasks.push(`${paymentIssues} payment issue${paymentIssues === 1 ? "" : "s"}`);
    }

    if (!tasks.length) {
      return "There is nothing urgent showing right now. Start by checking recent enquiries, then learner records.";
    }

    return `Start with ${tasks.join(", ")}. I would handle enquiries first, then enrolments, then payment issues.`;
  }, [newEnquiries, enrolmentsToReview, paymentIssues]);

  function answer(raw: string) {
    const value = raw.trim().toLowerCase();

    if (!value) {
      setReply({ text: "Type a short question, for example: What should I do first?" });
      return;
    }

    if (
      value.includes("first") ||
      value.includes("next") ||
      value.includes("today") ||
      value.includes("attention")
    ) {
      setReply({
        text: priorityReply,
        href: "/admin#enquiries",
        linkLabel: "Go to what needs attention",
      });
      return;
    }

    if (
      value.includes("learner") ||
      value.includes("student") ||
      value.includes("record")
    ) {
      setReply({
        text: "Learner Records keeps the private course register in one place. The overview hides sensitive information such as ID/passport numbers and addresses.",
        href: "/admin/learners",
        linkLabel: "Open learner records",
      });
      return;
    }

    if (value.includes("under review") || value.includes("review")) {
      setReply({
        text: "Under review means an application has been received but a staff member still needs to check the learner details, programme/intake fit, and any required information before accepting or rejecting it.",
        href: "/admin#enrolments",
        linkLabel: "View enrolments",
      });
      return;
    }

    if (value.includes("enquir") || value.includes("lead") || value.includes("customer")) {
      setReply({
        text: "Enquiries are people, organisations or partners asking about Makabongwe programmes. New enquiries should be contacted and then moved to the correct follow-up status.",
        href: "/admin#enquiries",
        linkLabel: "View enquiries",
      });
      return;
    }

    if (value.includes("payment") || value.includes("paystack")) {
      setReply({
        text: "Payment status shows whether an enrolment payment succeeded, is still pending, or failed. Never ask someone to send card details over WhatsApp or email.",
        href: "/admin#overview",
        linkLabel: "View payment summary",
      });
      return;
    }

    if (
      value.includes("logout") ||
      value.includes("sign out") ||
      value.includes("leave")
    ) {
      setReply({
        text: "Use the Sign out button at the bottom of the admin. Always sign out on a shared or borrowed device.",
      });
      return;
    }

    if (
      value.includes("password") ||
      value.includes("login") ||
      value.includes("access")
    ) {
      setReply({
        text: "If you cannot sign in, use Forgot password on the login screen. Real admin access will use an approved staff email; never share the password or recovery link.",
        href: "/admin/login",
        linkLabel: "Go to admin login",
      });
      return;
    }

    if (
      value.includes("programme") ||
      value.includes("course") ||
      value.includes("intake")
    ) {
      setReply({
        text: "Programmes are the training offerings shown on the website. Before promoting one, check that it is published, open for enrolment, and has the correct intake and pricing information.",
        href: "/admin#programmes",
        linkLabel: "View programme controls",
      });
      return;
    }

    setReply({
      text: "I do not want to guess. Try asking about enquiries, enrolments, learner records, payments, programmes, login, or what you should do first.",
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    answer(question);
  }

  return (
    <div className={styles.assistantRoot}>
      {open ? (
        <section
          className={styles.assistantPanel}
          aria-label="Makabongwe Admin Assistant"
        >
          <div className={styles.assistantHeader}>
            <div>
              <span>Makabongwe Assistant</span>
              <strong>How can I help?</strong>
            </div>
            <button
              type="button"
              className={styles.assistantClose}
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
            >
              ×
            </button>
          </div>

          <div className={styles.assistantBody}>
            <div className={styles.assistantReply}>
              <span>Assistant</span>
              <p>{reply.text}</p>
              {reply.href && reply.linkLabel ? (
                <Link href={reply.href} onClick={() => setOpen(false)}>
                  {reply.linkLabel} →
                </Link>
              ) : null}
            </div>

            <div className={styles.assistantQuick}>
              {quickQuestions.map((item) => (
                <button key={item} type="button" onClick={() => answer(item)}>
                  {item}
                </button>
              ))}
            </div>

            <form className={styles.assistantForm} onSubmit={submit}>
              <label htmlFor="admin-assistant-question">Ask in your own words</label>
              <div>
                <input
                  id="admin-assistant-question"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="e.g. Where do I find learners?"
                  maxLength={180}
                />
                <button type="submit">Ask</button>
              </div>
            </form>

            <p className={styles.assistantSafety}>
              This helper explains the admin and points you to the right place. It
              cannot change learner records, payments or account access.
            </p>
          </div>
        </section>
      ) : null}

      <button
        type="button"
        className={styles.assistantLauncher}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span aria-hidden="true">?</span>
        Help me
      </button>
    </div>
  );
}
