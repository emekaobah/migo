import type { FaqSection } from '@/api/interfaces/faq-source';

/**
 * Migo's live FAQ — **verbatim** (HANDOFF §19).
 *
 * 10 sections, 45 questions, ported mechanically from the design bundle's
 * `faq-data.js` rather than retyped, so the wording cannot drift from what the
 * website publishes. **Do not edit these strings by hand.**
 *
 * ⚠ **The source contradicts itself on the extension rule.** "How do I extend
 * my loan?" says 30% of the outstanding balance; "I cannot pay but do not want
 * my offers affected" says 20%. Both are reproduced, because verbatim means
 * verbatim and silently correcting a client's published copy is not this
 * build's call to make. The `extend` screen follows the client-confirmed 30%
 * (PLAN §5), so one FAQ answer disagrees with it on the same device. Recorded
 * in design/OPEN-QUESTIONS.md.
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
          'Migo (formerly kwikmoney) is a cloud-based platform that enables you to use a loan to make purchases from merchants or withdraw cash without the need for a smartphone, point-of-sale hardware or plastic cards.',
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
          '1. Enter and verify your phone number here: Get a Loan or dial our dedicated USSD code *561# and follow the instructions.',
          '2. Choose the best fitting loan offer.',
          '3. Add your banking information so Migo can pay you.',
          'Questions? Contact Us.',
        ],
      },
      {
        q: 'How long does it take to get a Migo loan?',
        a: [
          'We work hard to ensure that your loan enters your account, or the account of the merchant that you are paying, immediately after you complete your application session. If for some reason your transaction does not happen this way, please Contact Us.',
        ],
      },
      {
        q: 'Can I access Migo if I port my number to another network?',
        a: [
          'Yes, as long as your SIM registration details match your bank account details. We operate our USSD service across all networks.',
        ],
      },
      {
        q: 'Can I use USSD shortcuts to request a Migo loan?',
        a: [
          'Yes, to avoid multiple screen selections, you can use USSD menu shortcuts by placing your menu selections in the code you dial. Here are some examples:',
          '*561*1*1# Take out a loan',
          '*561*1*3# Repay a loan',
          '*561*1*4# Check loan balance',
          '*561*1*5# Extend your loan',
          '*561*1*6# Terms and conditions',
        ],
      },
      {
        q: 'Do you have a mobile app?',
        a: [
          'No, we currently do not, but you can access loans via your web browser.',
        ],
      },
      {
        q: 'Can I access Migo with another person\'s phone number?',
        a: [
          'No, your loan offers are specific to you. To offer you a loan, we must be sure that your SIM registration details match your BVN information.',
        ],
      },
      {
        q: 'Do I need to provide collateral or documentation to request a Migo loan?',
        a: [
          'No, you do not need any collateral or documentation to request your Migo loan.',
        ],
      },
      {
        q: 'Do I need to visit a bank to request a Migo loan?',
        a: [
          'No. You can conveniently apply for the loan from your mobile phone. All you need is a bank account linked to a valid BVN. Visit Get a Loan to apply now.',
        ],
      },
      {
        q: 'Do I need to talk to a loan agent to request a Migo loan?',
        a: [
          'No, you can apply for your Migo loan directly from your phone or computer, never through an agent. However, we are happy to assist you if you have any questions, call us on +2347080637315 or send us an email at support@migo.money.',
        ],
      },
      {
        q: 'How do I qualify for a Migo loan?',
        a: [
          'You qualify for loans based on your personal information. The more information we can find on you, the easier it is to qualify.',
        ],
      },
      {
        q: 'Do you deposit Migo loans into all banks?',
        a: [
          'Your Migo loan can be deposited into any of the following banks:',
          '• Access Bank',
          '• Diamond Bank',
          '• Fidelity Bank',
          '• First Bank',
          '• First City Monument Bank (FCMB)',
          '• Guaranty Trust Bank (GTB)',
          '• Heritage Bank',
          '• Skye Bank',
          '• Stanbic Bank',
          '• Union Bank',
          '• United Bank For Africa (UBA)',
          '• Unity Bank',
          '• Wema Bank',
          '• Zenith Bank',
        ],
      },
      {
        q: 'Can I get a Migo loan in two different bank accounts using the same phone number?',
        a: [
          'You can register any number of bank accounts to receive your Migo loan, provided the account information matches your SIM registration information. However, you can only receive one loan at a time.',
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
          'Migo loan amounts range from N750 up to N1,000,000 and beyond! For first-time borrowers, we start with a smaller loan to build a relationship, and as you establish trust with us, your loan offers increase over time.',
        ],
      },
      {
        q: 'How do you determine the amount I qualify for?',
        a: [
          'Your loan offers are based on your personal information and your loan repayment history. The more you pay your loans on time, the higher the amounts you can get.',
        ],
      },
      {
        q: 'Can I request specific amounts?',
        a: [
          'Your personal information is used to determine your unique loan offers, and we provide a range within your available credit limit from which you can select. Currently, we are unable to fulfill requests for specific amounts.',
        ],
      },
      {
        q: 'Does Migo offer business loans?',
        a: [
          'We don\'t categorize loans by purpose at the moment, so you can use your loan for any need, including business.',
        ],
      },
      {
        q: 'How do I increase my loan offers?',
        a: [
          'The best way to increase your loan offers is to pay back your loan on or before the due date. With Migo, your offers are a reflection of your borrowing behavior. The more frequent your early repayments, the better your future offers. It is also better to extend your loan, to preserve your offers, rather than miss a payment date.',
        ],
      },
      {
        q: 'Why don\'t I have any loan offers?',
        a: [
          'We aim to make you an offer every time you make a request, no matter how small. However, in instances where we are unable to ascertain your personal information, we may not be able to make you an offer.',
        ],
      },
      {
        q: 'If I provide a guarantor, can I get a larger offer?',
        a: [
          'No guarantors are required to get a Migo loan. Your loan offers will continue to grow at a steady pace as you borrow and repay early.',
        ],
      },
      {
        q: 'How come my offers dropped or have not increased since my last loan?',
        a: [
          'Your loan offers grow at a steady pace provided you meet all the terms and conditions and repay your loans early. Your loan offers will only drop if you have defaulted on a previous loan.',
        ],
      },
      {
        q: 'I cannot pay but do not want my offers affected, what do I do?',
        a: [
          'To ensure your offers are not affected, you can make a partial payment of 20% of the total outstanding amount and get a 30-day extension.',
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
          'There are several ways to pay back your Migo loan. Visit www.migo.money/consumer/repay-a-loan and select the option that works best for you from the list provided.',
        ],
      },
      {
        q: 'How do I make a partial repayment?',
        a: [
          'Visit www.migo.money/consumer/repay-a-loan, select your preferred repayment method, change the amount to be paid, and confirm the payment. A partial repayment is a good option to take to preserve your good repayment history and avoid a reduction in your next loan amount.',
        ],
      },
      {
        q: 'Can I make a transfer from my account to pay my loan?',
        a: [
          'Yes. Migo accepts transfer payments through a unique account number that will be sent to you, only when you request it. Once you successfully make the transfer to the account number, you will get a payment confirmation message. To review transfer payment instructions, or make a payment using the transfer option, visit Repay a Loan.',
        ],
      },
      {
        q: 'How do I extend my loan?',
        a: [
          'You can extend your loan if you repay at least 30% of your total outstanding balance (principal + interest) before your due date. Your loan will be automatically extended and you don\'t need to contact us or request an extension directly. The extension will be applied by midnight on your original due date. Your new outstanding balance and repayment date will be shared with you. However, please note that a reduced charge will still apply. To make a payment towards extending your loan, visit Repay a Loan.',
        ],
      },
      {
        q: 'Can Migo debit my account directly?',
        a: [
          'At the moment, this option is not available, but we are always looking for ways to serve you better. In the meantime, please visit www.migo.ng/consumer/repay-a-loan and select the option that works best for you.',
        ],
      },
      {
        q: 'Can I repay my Migo loan on any other platform?',
        a: [
          'Our verified repayment methods are all on www.migo.money. Any other channels or methods are unauthorized, and Migo cannot be held liable for fraudulent transactions that result from engaging with them.',
        ],
      },
      {
        q: 'Do I have to pay my Migo loan with the same card I registered when I applied for the loan?',
        a: [
          'You can repay your Migo loan using any valid debit card. If you previously registered a card and would like to change that card, please visit www.my.migo.money and follow the instructions to add a new payment card.',
        ],
      },
      {
        q: 'I lost the line I used to get a loan. How can I make a repayment?',
        a: [
          'If you can no longer access the phone you used to take your Migo loan, please reach out to us here.',
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
          'Your interest rates, just like your loan amounts vary based on your personal information and loan repayment history. Interest rates could reduce, while loan amounts increase with good repayment history and vice versa.',
        ],
      },
      {
        q: 'How much does it cost to take a Migo loan?',
        a: [
          'Interest rates range from 5%-25%. The rate applied depends on your repayment history and the loan term. Interest rates are not fixed and can be reduced by repaying your loans early. You can also get reduced interest rates when you recommend friends to take a loan and repay.',
        ],
      },
      {
        q: 'How do I get a 30-day loan?',
        a: [
          '30 day loans are offered to you based on your unique borrowing behaviour. Keep repaying your loans early to unlock 30-day loan offers.',
        ],
      },
      {
        q: 'How is my Migo loan balance calculated?',
        a: [
          'You pay loan interest as specified in the offer, with additional 5% fees + VAT if you pay late or if you default. For example, if you take a N10,000 Migo loan @ 10%, your loan balance is as follows:',
          'If you pay by the due date:',
          'Loan value: N10,000',
          '10% loan interest: N1,000',
          'LOAN BALANCE: N11,000',
          'If you pay after the automatic rollover:',
          '10% rollover interest: N1,000',
          '5% late fee: N500',
          '5% VAT on late fee: N25',
          'LOAN BALANCE: N12,525',
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
          'For us to keep increasing your loan offers and offering loans to more people, you must repay your loans when due. In the unfortunate event that you do not repay your loan on the due date, we will charge an additional default fee (5%). If you still do not repay, further penalties, as agreed in the terms and conditions, will be issued. Rather than paying late, a good option that helps preserve your loan history is partial repayment or extending your loan.',
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
          'We developed our T&Cs with your comfort and security in mind, so you must understand what you agree to when you take a Migo loan. Migo highlights four main points you must agree to when you accept a loan offer:',
          '• To pay the loan balance on or before the due date:',
          'This term means you understand that Migo is a loan that must be paid back by the due date to continue enjoying the service.',
          '• To allow the use of your personal data to determine loan offers:',
          'This term means that you have given consent to Migo to consider and analyze your personal data and provide you with the best available loan offers. Your personal data comes from many sources, including your phone, your bank, bill payments, credit bureaus, and other sources.',
          '• To be subject to fees and penalties for late payment:',
          'To enable us to continue lending to more customers while increasing your loan offers, we must recover loans granted. When you do not repay your loan on the due date, we are forced to charge additional fees and interest. This term means you have given your consent to be subject to these charges if your loan repayment is late.',
          '• To allow messages to your contacts if you do not pay:',
          'This term means you consent to Migo sending text messages to anyone you have ever called or sent an SMS if we are unable to reach you. Migo will only send these messages after multiple unsuccessful attempts to contact you after your loan repayment date has passed.',
          'Please visit www.migo.money/terms-conditions/ to read our full Terms & Conditions. If you need further explanation, we would be happy to help you. Please call us on +2347080637315.',
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
          'Please re-register your SIM card, so your SIM registration details match your bank account details.',
        ],
      },
      {
        q: 'I got an error saying that the loan is delayed because you couldn\'t reach my bank. What do I do?',
        a: [
          'We\'re sorry, but sometimes there are interruptions in service amongst our network of partners. Please give us 72 hours to provide feedback on the issue. If you have not heard from us within this time, please call us on +2347080637315.',
        ],
      },
      {
        q: 'I repaid my Migo loan, but I did not receive a payment confirmation. What do I do?',
        a: [
          'We\'re sorry, but sometimes there are interruptions in service among our network of partners. Please send an email to support@migo.money with proof of the deposit that shows the date of payment, and one of our customer experience representatives would be happy to assist you.',
        ],
      },
      {
        q: 'Migo is messaging me about a loan I know nothing about, how do I resolve this?',
        a: [
          'Your loans are linked to your phone number and BVN, so we will need to go through our verification process with you. Please call us on +2347080637315 or send an email to support@migo.money, providing the mobile number where the SMS was sent and we would be happy to help resolve this.',
        ],
      },
      {
        q: 'I repaid my Migo loan, why did my contacts still get notified?',
        a: [
          'Our system only sends out notifications as a last resort in instances where customers have been unreachable. If you have repaid your past loans, please call us on +2347080637315 or email us at support@migo.money with proof and the date of payment. One of our customer care representatives would be happy to assist you.',
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
          'Your security and privacy are our topmost priority, and so we have implemented multiple security measures to safeguard your information. We are also fully compliant with all regulations and national laws governing consumer and data protection.',
        ],
      },
      {
        q: 'I received a notification from Migo to help reach a contact of mine to discuss a business issue, am I liable?',
        a: [
          'No, you are not liable. With their consent, we reach out to the friends and family of our customers, when we are unable to reach them after multiple attempts.',
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
          'We are always looking to partner with businesses to offer credit services to their customers, so we would be more than happy to hear from you. Please send us an email at info@migo.money.',
        ],
      },
      {
        q: 'I am interested in employment with Migo, how do I reach you?',
        a: [
          'Please send your CV to careers@migo.money.',
        ],
      },
    ],
  },
];
