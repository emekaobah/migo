import type { FaqSection } from '@/api/interfaces/faq-source';

/**
 * Illustrative help content (HANDOFF §19).
 *
 * The structure follows Migo's published FAQ: the same 10 sections, the same
 * 45 questions, and broadly the same meaning per answer. The answers are this
 * project's own wording, written for this app: they name its screens (Repay,
 * Extend, Help) rather than web pages, and point to Migo support rather than
 * to addresses, inboxes or phone lines that may change. Edit freely, but keep
 * the section keys — the FAQ route depends on them — and keep the extension
 * answers in step with the API's extension terms, which `faq-search.test.ts`
 * enforces.
 *
 * In production this comes from the SalesIQ knowledge base, not a static file.
 */
export const FAQ: FaqSection[] = [
  {
    key: 'about-migo',
    title: 'About Migo',
    questions: [
      {
        q: 'What is Migo?',
        a: [
          'Migo is a digital lender. It lends to people without asking for a smartphone, a card or a branch visit, and the loan can be paid out to your bank account or used to pay a merchant.',
        ],
      },
    ],
  },
  {
    key: 'accessing-migo-loans',
    title: 'Accessing Migo loans',
    questions: [
      {
        q: 'How do I get a Migo loan?',
        a: [
          '1. Verify your phone number, in this app or by dialling *561# on any phone.',
          '2. Pick the offer that suits you.',
          '3. Choose the bank account the money should go to.',
          'Stuck at any step? Chat with Migo support from Help.',
        ],
      },
      {
        q: 'How long does it take to get a Migo loan?',
        a: [
          'Usually no time at all: the money is sent as soon as you accept the offer. If it has not arrived, chat with Migo support from Help and we will trace it.',
        ],
      },
      {
        q: 'Can I access Migo if I port my number to another network?',
        a: [
          'Yes. The USSD service works on every network, so switching networks changes nothing, provided the name on your SIM still matches the name on your bank account.',
        ],
      },
      {
        q: 'Can I use USSD shortcuts to request a Migo loan?',
        a: [
          'Yes. Instead of stepping through the menu, you can dial your menu choices in one go. For example:',
          '*561*1*1# to take out a loan',
          '*561*1*3# to repay',
          '*561*1*4# to check your balance',
          '*561*1*5# to extend',
          '*561*1*6# to read the terms',
        ],
      },
      {
        q: 'Do you have a mobile app?',
        a: [
          'You are using it. The app sits alongside Migo\'s USSD service and website, so you can borrow and repay from whichever is easiest at the time.',
        ],
      },
      {
        q: 'Can I access Migo with another person\'s phone number?',
        a: [
          'No. Offers are made to you personally, and we can only make one when the details on the SIM match the details held against your BVN.',
        ],
      },
      {
        q: 'Do I need to provide collateral or documentation to request a Migo loan?',
        a: [
          'No. There is nothing to pledge and no paperwork to upload.',
        ],
      },
      {
        q: 'Do I need to visit a bank to request a Migo loan?',
        a: [
          'No. Everything happens on your phone. You need a bank account linked to a valid BVN, and that is all.',
        ],
      },
      {
        q: 'Do I need to talk to a loan agent to request a Migo loan?',
        a: [
          'No. Migo does not work through agents, and you never need one to apply. If you have a question along the way, chat with Migo support from Help.',
        ],
      },
      {
        q: 'How do I qualify for a Migo loan?',
        a: [
          'Offers are based on what we can learn about you. The more complete that picture is, the more likely you are to qualify.',
        ],
      },
      {
        q: 'Do you deposit Migo loans into all banks?',
        a: [
          'Most Nigerian banks are supported. When you add a payout account, the app only lists banks we can pay into, so any bank you can pick will work.',
        ],
      },
      {
        q: 'Can I get a Migo loan in two different bank accounts using the same phone number?',
        a: [
          'You can save more than one payout account, as long as each is in the same name as your SIM registration. You can still only have one loan running at a time.',
        ],
      },
    ],
  },
  {
    key: 'loan-offers',
    title: 'Loan Offers',
    questions: [
      {
        q: 'How much money can I borrow with Migo?',
        a: [
          'It depends on your history with us. First loans start small, and offers grow as you repay, so regular borrowers see much larger amounts over time.',
        ],
      },
      {
        q: 'How do you determine the amount I qualify for?',
        a: [
          'From your personal information and how you have repaid before. Repaying on time is the surest way to raise the amounts you are offered.',
        ],
      },
      {
        q: 'Can I request specific amounts?',
        a: [
          'Not at the moment. Each offer sets a range within your limit, and you choose from what is shown.',
        ],
      },
      {
        q: 'Does Migo offer business loans?',
        a: [
          'Loans are not tied to a purpose, so you are free to use one for your business.',
        ],
      },
      {
        q: 'How do I increase my loan offers?',
        a: [
          'Repay on or before the due date. Your offers follow your track record, so early repayments help most. If you cannot pay in full, extending the loan protects your offers far better than missing the date.',
        ],
      },
      {
        q: 'Why don\'t I have any loan offers?',
        a: [
          'We try to make an offer every time you ask, even a small one. Occasionally we cannot confirm enough about you to make one, and then no offer appears.',
        ],
      },
      {
        q: 'If I provide a guarantor, can I get a larger offer?',
        a: [
          'Migo does not use guarantors. Your offers grow on their own as you borrow and repay on time.',
        ],
      },
      {
        q: 'How come my offers dropped or have not increased since my last loan?',
        a: [
          'Offers rise gradually while you keep to the terms and repay on time. They only fall after a loan has gone into default.',
        ],
      },
      {
        q: 'I cannot pay but do not want my offers affected, what do I do?',
        a: [
          'Extend the loan rather than let the date pass. Paying 30% of your outstanding balance extends it, and whatever is left moves out by 30 days, so the loan is not overdue and a missed payment does not count against you.',
        ],
      },
    ],
  },
  {
    key: 'loan-repayment',
    title: 'Loan Repayment',
    questions: [
      {
        q: 'How do I pay back my Migo loan?',
        a: [
          'Tap Repay on your loan screen. Pick a bank, tap Get my wallet details, and transfer the amount shown to your wallet account. The payment is matched automatically and your loan updates when it lands.',
        ],
      },
      {
        q: 'How do I make a partial repayment?',
        a: [
          'Each transfer to your wallet clears an instalment, so a loan with several payments can be paid off one instalment at a time. If you cannot manage the instalment that is due, use Extend instead of missing the date: it keeps your repayment record intact.',
        ],
      },
      {
        q: 'Can I make a transfer from my account to pay my loan?',
        a: [
          'Yes, that is how wallet repayment works. Tap Repay, get your wallet details, and send the amount from any bank app. The app confirms the payment once it has been received.',
        ],
      },
      {
        q: 'How do I extend my loan?',
        a: [
          'Tap Extend on your loan screen before your due date. To extend, you pay 30% of what you owe today, and the rest of the balance carries for 30 days to a new due date.',
          'Before you confirm, the screen sets out what you pay now, what carries over and the new date. Interest applies to the part that carries over. If anything looks wrong, chat with Migo support from Help.',
        ],
      },
      {
        q: 'Can Migo debit my account directly?',
        a: [
          'Not yet. For now, repay by transfer to your wallet from the Repay screen.',
        ],
      },
      {
        q: 'Can I repay my Migo loan on any other platform?',
        a: [
          'Only pay through the methods Migo offers you, such as your wallet in this app. Payments made anywhere else are not recognised, and Migo cannot answer for money lost to them.',
        ],
      },
      {
        q: 'Do I have to pay my Migo loan with the same card I registered when I applied for the loan?',
        a: [
          'No. Repayment is by transfer to your wallet, so you can pay from any account you like.',
        ],
      },
      {
        q: 'I lost the line I used to get a loan. How can I make a repayment?',
        a: [
          'Chat with Migo support from Help. We will confirm it is you and tell you how to pay without the old line.',
        ],
      },
    ],
  },
  {
    key: 'interest-and-tenure',
    title: 'Interest & Tenure',
    questions: [
      {
        q: 'Why are there different interest rates?',
        a: [
          'Rates are personal, like loan amounts. A good repayment record tends to bring rates down and amounts up; a poor one does the opposite.',
        ],
      },
      {
        q: 'How much does it cost to take a Migo loan?',
        a: [
          'It depends on the loan\'s length and your repayment history. Rates are not fixed: repaying early brings your interest down over time, and so does referring friends who borrow and repay.',
        ],
      },
      {
        q: 'How do I get a 30-day loan?',
        a: [
          'Longer loans are unlocked by your borrowing record. Keep repaying early and they will start to appear among your offers.',
        ],
      },
      {
        q: 'How is my Migo loan balance calculated?',
        a: [
          'You pay the interest stated in your offer. Paying late adds a late fee of 5%, plus VAT on that fee, and the loan rolls over with further interest.',
          'Take a loan of N10,000 at 10% interest. Paid by the due date, you owe N11,000.',
          'Paid after the rollover, you owe N12,525: the N11,000, plus N1,000 of rollover interest, a N500 late fee and N25 of VAT on the fee.',
        ],
      },
    ],
  },
  {
    key: 'late-repayment',
    title: 'Late Repayment',
    questions: [
      {
        q: 'What happens if I do not pay back my Migo loan?',
        a: [
          'Repaying on time keeps your offers growing and lets Migo keep lending to others. If the due date passes without payment, a default fee of 5% is added, and further penalties set out in the terms can follow. If you cannot pay in full, extending the loan protects your record far better than paying late.',
        ],
      },
    ],
  },
  {
    key: 'terms-and-conditions',
    title: 'Terms and Conditions',
    questions: [
      {
        q: 'What should I do if I don\'t understand the Terms and Conditions?',
        a: [
          'Ask us. When you accept an offer you agree to four main things, in short:',
          '• Repay the balance by the due date.',
          '• Let Migo use your personal data, from sources such as your phone, your bank and credit bureaus, to decide what to offer you.',
          '• Pay the fees and penalties set out in the terms if you pay late.',
          '• Allow Migo to contact people you know if it cannot reach you after the due date has passed.',
          'The full terms are linked from Help. If any part is unclear, chat with Migo support and we will explain it.',
        ],
      },
    ],
  },
  {
    key: 'errors',
    title: 'Errors',
    questions: [
      {
        q: 'I received an error message saying my bank account and SIM registration details do not match. What should I do?',
        a: [
          'Update your SIM registration with your network so the details on it match the details your bank holds, then try again.',
        ],
      },
      {
        q: 'I got an error saying that the loan is delayed because you couldn\'t reach my bank. What do I do?',
        a: [
          'Occasionally a partner bank is unavailable. Allow up to 72 hours for us to come back to you, and if you have heard nothing by then, chat with Migo support from Help.',
        ],
      },
      {
        q: 'I repaid my Migo loan, but I did not receive a payment confirmation. What do I do?',
        a: [
          'Payments sometimes take longer to reach us when a partner is having problems. Chat with Migo support from Help and share proof of the transfer showing the date you paid, and we will sort it out.',
        ],
      },
      {
        q: 'Migo is messaging me about a loan I know nothing about, how do I resolve this?',
        a: [
          'Loans are tied to a phone number and a BVN, so we will need to verify you. Chat with Migo support from Help and tell us which number received the message.',
        ],
      },
      {
        q: 'I repaid my Migo loan, why did my contacts still get notified?',
        a: [
          'Contacts are only ever messaged as a last resort, when a borrower could not be reached. If you had already repaid, chat with Migo support from Help with proof and the date of payment, and we will look into it.',
        ],
      },
    ],
  },
  {
    key: 'security-and-privacy',
    title: 'Security and Privacy',
    questions: [
      {
        q: 'Are my personal data and bank/card details secure with Migo?',
        a: [
          'Protecting your information is a priority. Several layers of security protect it, and Migo follows the regulations on data protection and consumer protection that apply to it.',
        ],
      },
      {
        q: 'I received a notification from Migo to help reach a contact of mine to discuss a business issue, am I liable?',
        a: [
          'No, you are not liable. We only contact a borrower\'s friends or family, with the borrower\'s consent, after repeated attempts to reach them have failed.',
        ],
      },
    ],
  },
  {
    key: 'partnership',
    title: 'Partnership',
    questions: [
      {
        q: 'How do I partner with Migo?',
        a: [
          'Migo works with businesses that want to offer credit to their customers. Get in touch through Migo\'s website and the partnerships team will pick it up.',
        ],
      },
      {
        q: 'I am interested in employment with Migo, how do I reach you?',
        a: [
          'Open roles and how to apply are listed on Migo\'s website.',
        ],
      },
    ],
  },
];
