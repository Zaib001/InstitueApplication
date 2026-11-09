/**
* Monsieur Fanyi — Responsive Branded HTML Email Templates
* Conforme aux standards graphiques de la plateforme (Bleu Marine #122b49, Or #e59a38)
* Support bilingue FR (défaut) et EN.
*/

export interface EmailRenderResult {
  subject: string;
  html: string;
  text: string;
}

export interface EmailTemplateData {
  recipientName?: string;
  locale?: string;
  appUrl?: string;
  [key: string]: any;
}

function getBaseStyles() {
  return `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; -webkit-text-size-adjust: 100%; }
    .wrapper { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; margin-top: 24px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #122b49 0%, #1e4573 100%); padding: 32px 24px; text-align: center; }
    .logo-badge { display: inline-block; padding: 6px 14px; background-color: rgba(255, 255, 255, 0.12); border-radius: 9999px; border: 1px solid rgba(255, 255, 255, 0.2); font-size: 11px; font-weight: 700; color: #f8fafc; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .title { color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; }
    .title span { color: #e59a38; }
    .content { padding: 32px 28px; line-height: 1.6; }
    .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px; }
    .lead { font-size: 15px; color: #334155; margin-bottom: 20px; }
    .info-box { background-color: #f1f5f9; border-left: 4px solid #122b49; padding: 16px; border-radius: 8px; margin: 20px 0; font-size: 14px; }
    .info-box.alert { border-left-color: #e59a38; background-color: #fffbeb; }
    .cta-container { text-align: center; margin: 28px 0; }
    .cta-button { display: inline-block; background-color: #122b49; color: #ffffff !important; padding: 14px 28px; font-size: 14px; font-weight: 700; border-radius: 12px; text-decoration: none; box-shadow: 0 2px 4px rgba(18, 43, 73, 0.2); }
    .cta-button.gold { background-color: #e59a38; color: #ffffff !important; }
    .meta-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
    .meta-table td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
    .meta-table td.label { font-weight: 600; color: #64748b; width: 35%; }
    .meta-table td.value { color: #0f172a; font-weight: 500; }
    .footer { background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; line-height: 1.5; }
    .footer a { color: #122b49; text-decoration: underline; }
    .disclaimer { font-size: 11px; color: #94a3b8; margin-top: 12px; }
  `;
}

function renderHtmlLayout(subject: string, bodyContent: string, isEnglish: boolean, appUrl: string): string {
  const currentYear = new Date().getFullYear();
  const address = isEnglish
    ? "Monsieur Fanyi • Academic Tutoring Platform • Kipé, Ratoma, Conakry, Guinea"
    : "Monsieur Fanyi • Plateforme d'Excellence de Soutien Scolaire • Kipé, Ratoma, Conakry, Guinée";
  const securityNotice = isEnglish
    ? "This is an automated transactional message. Never share your passwords or security links."
    : "Ceci est un message transactionnel sécurisé automatique. Ne partagez jamais vos identifiants ou liens de sécurité.";

  return `<!DOCTYPE html>
<html lang="${isEnglish ? "en" : "fr"}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>${getBaseStyles()}</style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo-badge">${isEnglish ? "Academic Excellence • Guinea" : "Excellence Scolaire • Guinée"}</div>
      <h1 class="title">Monsieur <span>Fanyi</span></h1>
    </div>
    <div class="content">
      ${bodyContent}
    </div>
    <div class="footer">
      <p style="margin: 0 0 8px 0; font-weight: 600; color: #334155;">${address}</p>
      <p style="margin: 0;">
        <a href="${appUrl}">${isEnglish ? "Visit Platform" : "Accéder à la plateforme"}</a> • 
        <a href="${appUrl}/contact">${isEnglish ? "Contact Support" : "Support Client"}</a>
      </p>
      <p class="disclaimer">${securityNotice}<br>&copy; ${currentYear} Monsieur Fanyi. ${isEnglish ? "All rights reserved." : "Tous droits réservés."}</p>
    </div>
  </div>
</body>
</html>`;
}

export class EmailTemplateRegistry {
  /**
   * Shorthand renderer matching (templateName, data, locale) signature
   */
  static render(templateName: string, data: EmailTemplateData, locale?: string): EmailRenderResult {
    return this.renderTemplate(templateName, { ...data, locale: locale || data.locale || "fr" });
  }

  /**
   * Renders a specific email template by name
   */
  static renderTemplate(templateName: string, data: EmailTemplateData): EmailRenderResult {
    const isEn = data.locale === "en";
    const appUrl = data.appUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const name = data.recipientName || (isEn ? "User" : "Cher membre");

    switch (templateName) {
      // 1. Welcome
      case "welcome": {
        const subject = isEn ? "Welcome to Monsieur Fanyi!" : "Bienvenue sur Monsieur Fanyi !";
        const body = `
          <h2 class="greeting">${isEn ? `Welcome, ${name}!` : `Bienvenue, ${name} !`}</h2>
          <p class="lead">${isEn
            ? "Your account has been successfully created on Monsieur Fanyi, the premier home and online tutoring platform in Guinea."
            : "Votre compte a été créé avec succès sur Monsieur Fanyi, la plateforme de référence pour le soutien scolaire à domicile et en ligne en Guinée."
          }</p>
          <div class="info-box">
            <strong>${isEn ? "Next Steps:" : "Prochaines étapes :"}</strong>
            <p style="margin: 4px 0 0 0;">${isEn
            ? "Access your dashboard to discover qualified teachers, publish learning requests, or manage your classes."
            : "Accédez à votre tableau de bord pour découvrir des professeurs certifiés, publier une demande de cours ou organiser vos séances."
          }</p>
          </div>
          <div class="cta-container">
            <a href="${appUrl}/login" class="cta-button">${isEn ? "Access My Dashboard" : "Accéder à mon tableau de bord"}</a>
          </div>
        `;
        return {
          subject,
          html: renderHtmlLayout(subject, body, isEn, appUrl),
          text: `${subject}\n\n${name},\n${isEn ? "Welcome to Monsieur Fanyi." : "Bienvenue sur Monsieur Fanyi."}\n${appUrl}/login`,
        };
      }

      // 2. Account Activation (Assisted Phone Registration)
      case "account-activation": {
        const activationLink = data.activationLink || `${appUrl}/reset-password?token=${data.token}`;
        const subject = isEn ? "Activate your Monsieur Fanyi Account" : "Activez votre compte Monsieur Fanyi";
        const body = `
          <h2 class="greeting">${isEn ? `Hello ${name},` : `Bonjour ${name},`}</h2>
          <p class="lead">${isEn
            ? "An administrator has pre-registered your account following your inquiry. Please define your password to activate your portal."
            : "L'administration Monsieur Fanyi a pré-enregistré votre compte suite à votre demande. Définissez votre mot de passe pour activer votre accès."
          }</p>
          <div class="info-box alert">
            <strong>${isEn ? "Important Security Notice:" : "Sécurité & Confidentialité :"}</strong>
            <p style="margin: 4px 0 0 0;">${isEn
            ? "This activation link is single-use and will expire in 7 days."
            : "Ce lien d'activation sécurisé est à usage unique et expire dans 7 jours."
          }</p>
          </div>
          <div class="cta-container">
            <a href="${activationLink}" class="cta-button gold">${isEn ? "Activate My Account" : "Activer mon compte"}</a>
          </div>
        `;
        return {
          subject,
          html: renderHtmlLayout(subject, body, isEn, appUrl),
          text: `${subject}\n\n${name},\n${isEn ? "Activate your account:" : "Activez votre compte :"}\n${activationLink}`,
        };
      }

      // 3. Password Reset
      case "password-reset": {
        const resetLink = data.resetLink || `${appUrl}/reset-password?token=${data.token}`;
        const subject = isEn ? "Password Reset Request" : "Réinitialisation de votre mot de passe";
        const body = `
          <h2 class="greeting">${isEn ? `Hello ${name},` : `Bonjour ${name},`}</h2>
          <p class="lead">${isEn
            ? "We received a request to reset your Monsieur Fanyi account password. Click below to set a new password."
            : "Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte Monsieur Fanyi. Cliquez sur le bouton ci-dessous pour en définir un nouveau."
          }</p>
          <div class="info-box alert">
            <strong>${isEn ? "Validity:" : "Durée de validité :"}</strong>
            <p style="margin: 4px 0 0 0;">${isEn
            ? "This link is single-use and valid for 60 minutes. If you did not make this request, you can safely ignore this email."
            : "Ce lien est à usage unique et valable pendant 60 minutes. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email."
          }</p>
          </div>
          <div class="cta-container">
            <a href="${resetLink}" class="cta-button">${isEn ? "Reset My Password" : "Réinitialiser mon mot de passe"}</a>
          </div>
        `;
        return {
          subject,
          html: renderHtmlLayout(subject, body, isEn, appUrl),
          text: `${subject}\n\n${name},\n${isEn ? "Reset link:" : "Lien de réinitialisation :"}\n${resetLink}`,
        };
      }

      // 4. Teacher Verification Approved
      case "teacher-verified": {
        const subject = isEn ? "Congratulations! Your Teacher Profile is Approved" : "Félicitations ! Votre profil enseignant est validé";
        const body = `
          <h2 class="greeting">${isEn ? `Congratulations, ${name}!` : `Félicitations, ${name} !`}</h2>
          <p class="lead">${isEn
            ? "Your teacher application has been verified and approved by the Monsieur Fanyi pedagogical team. You can now apply to student tutoring opportunities across Guinea."
            : "Votre dossier enseignant a été vérifié et approuvé par l'équipe pédagogique Monsieur Fanyi. Vous pouvez dès maintenant postuler aux offres de cours partout en Guinée."
          }</p>
          <div class="cta-container">
            <a href="${appUrl}/teacher/opportunities" class="cta-button gold">${isEn ? "Browse Opportunities" : "Découvrir les offres de cours"}</a>
          </div>
        `;
        return {
          subject,
          html: renderHtmlLayout(subject, body, isEn, appUrl),
          text: `${subject}\n\n${name},\n${isEn ? "Profile approved." : "Profil approuvé."}\n${appUrl}/teacher/opportunities`,
        };
      }

      // 5. Teacher Verification Rejected
      case "teacher-rejected": {
        const reason = data.reason || (isEn ? "Missing official diplomas or identity documents." : "Pièces justificatives incomplètes ou non conformes.");
        const subject = isEn ? "Update on Your Teacher Profile Application" : "Information concernant votre dossier enseignant";
        const body = `
          <h2 class="greeting">${isEn ? `Hello ${name},` : `Bonjour ${name},`}</h2>
          <p class="lead">${isEn
            ? "After careful review, the pedagogical team requires additional information or document corrections before your profile can be certified."
            : "Après examen attentif, l'équipe de modération vous invite à corriger ou compléter vos pièces justificatives afin de certifier votre profil."
          }</p>
          <div class="info-box alert">
            <strong>${isEn ? "Pedagogical Team Feedback:" : "Motif communiqué par l'équipe :"}</strong>
            <p style="margin: 4px 0 0 0;">${reason}</p>
          </div>
          <div class="cta-container">
            <a href="${appUrl}/teacher/onboarding" class="cta-button">${isEn ? "Update My Documents" : "Mettre à jour mon dossier"}</a>
          </div>
        `;
        return {
          subject,
          html: renderHtmlLayout(subject, body, isEn, appUrl),
          text: `${subject}\n\n${name},\n${reason}\n${appUrl}/teacher/onboarding`,
        };
      }

      // 6. Teacher Application Received (Notifies Parent)
      case "teacher-application-received": {
        const subjectName = data.subjectName || "votre demande";
        const teacherName = data.teacherName || "Un enseignant certifié";
        const subject = isEn ? `New Application for ${subjectName}` : `Nouvelle candidature reçue pour ${subjectName}`;
        const body = `
          <h2 class="greeting">${isEn ? `Hello ${name},` : `Bonjour ${name},`}</h2>
          <p class="lead">${isEn
            ? `Good news! ${teacherName} has submitted an application to tutor your child in ${subjectName}.`
            : `Bonne nouvelle ! Le professeur ${teacherName} a postulé pour accompagner votre enfant en ${subjectName}.`
          }</p>
          <div class="cta-container">
            <a href="${appUrl}/parent/requests/${data.requestId || ""}" class="cta-button gold">${isEn ? "Review Application" : "Consulter la candidature"}</a>
          </div>
        `;
        return {
          subject,
          html: renderHtmlLayout(subject, body, isEn, appUrl),
          text: `${subject}\n\n${name},\n${isEn ? "New application received:" : "Nouvelle candidature reçue :"}\n${appUrl}/parent/requests`,
        };
      }

      // 7. Teacher Shortlisted
      case "teacher-shortlisted": {
        const subjectName = data.subjectName || "votre candidature";
        const subject = isEn ? `Application Shortlisted for ${subjectName}` : `Candidature présélectionnée en ${subjectName}`;
        const body = `
          <h2 class="greeting">${isEn ? `Hello ${name},` : `Bonjour ${name},`}</h2>
          <p class="lead">${isEn
            ? `The family has shortlisted your tutoring application for ${subjectName}. You are one step closer to classroom assignment.`
            : `La famille a présélectionné votre candidature pour la demande de soutien en ${subjectName}. Vous êtes parmi les profils favoris retenus.`
          }</p>
          <div class="cta-container">
            <a href="${appUrl}/teacher/applications" class="cta-button">${isEn ? "View Applications" : "Voir mes candidatures"}</a>
          </div>
        `;
        return {
          subject,
          html: renderHtmlLayout(subject, body, isEn, appUrl),
          text: `${subject}\n\n${name},\n${isEn ? "Shortlisted!" : "Candidature présélectionnée !"}\n${appUrl}/teacher/applications`,
        };
      }

      // 8. Teacher Selected (Parent Selection)
      case "teacher-selected": {
        const studentName = data.studentName || "l'élève";
        const subjectName = data.subjectName || "la matière";
        const subject = isEn ? `Congratulations! You Were Selected for ${subjectName}` : `Félicitations ! Vous avez été retenu(e) en ${subjectName}`;
        const body = `
          <h2 class="greeting">${isEn ? `Congratulations ${name}!` : `Excellente nouvelle ${name} !`}</h2>
          <p class="lead">${isEn
            ? `The family has selected your application to accompany ${studentName} in ${subjectName}. The classroom has been initialized (awaiting advance payment confirmation).`
            : `La famille a officiellement retenu votre candidature pour encadrer ${studentName} en ${subjectName}. La classe a été créée (statut : en attente du règlement initial).`
          }</p>
          <div class="cta-container">
            <a href="${appUrl}/teacher/classes" class="cta-button gold">${isEn ? "Open Classroom" : "Accéder à ma classe"}</a>
          </div>
        `;
        return {
          subject,
          html: renderHtmlLayout(subject, body, isEn, appUrl),
          text: `${subject}\n\n${name},\n${isEn ? "Selected for classroom:" : "Retenu pour la classe :"}\n${appUrl}/teacher/classes`,
        };
      }

      // 9. Admin-Assisted Telephone Assignment
      case "admin-classroom-assigned": {
        const studentName = data.studentName || "l'élève";
        const subjectName = data.subjectName || "la matière";
        const subject = isEn ? `Direct Classroom Assignment: ${subjectName}` : `Affectation directe confirmée : ${subjectName}`;
        const body = `
          <h2 class="greeting">${isEn ? `Hello ${name},` : `Bonjour ${name},`}</h2>
          <p class="lead">${isEn
            ? `The Monsieur Fanyi administration has arranged a direct classroom assignment for ${studentName} in ${subjectName} following a telephone inquiry.`
            : `L'administration Monsieur Fanyi a procédé à une affectation directe pour ${studentName} en ${subjectName} suite à une demande reçue au standard téléphonique.`
          }</p>
          <div class="info-box">
            <strong>${isEn ? "Provenance:" : "Origine & Traçabilité :"}</strong>
            <p style="margin: 4px 0 0 0;">${isEn ? "Administrator-Assisted Telephone Inquiry" : "Réservation directe assistée par l'administration"}</p>
          </div>
          <div class="cta-container">
            <a href="${appUrl}/parent/classes" class="cta-button gold">${isEn ? "View Classroom" : "Consulter ma classe"}</a>
          </div>
        `;
        return {
          subject,
          html: renderHtmlLayout(subject, body, isEn, appUrl),
          text: `${subject}\n\n${name},\n${isEn ? "Direct assignment:" : "Affectation directe :"}\n${appUrl}/parent/classes`,
        };
      }

      // 10. Package Confirmed
      case "package-confirmed": {
        const totalAmountGnf = data.totalAmountGnf ? Number(data.totalAmountGnf).toLocaleString("fr-GN") : "---";
        const sessionsCount = data.sessionsCount || 8;
        const subject = isEn ? "Tutoring Package Terms Confirmed" : "Conditions du forfait de cours configurées";
        const body = `
          <h2 class="greeting">${isEn ? `Hello ${name},` : `Bonjour ${name},`}</h2>
          <p class="lead">${isEn
            ? `The tutoring package terms have been configured: ${sessionsCount} sessions for a total of ${totalAmountGnf} GNF.`
            : `Les modalités financières du cours ont été configurées : ${sessionsCount} séances pour un montant total de ${totalAmountGnf} GNF.`
          }</p>
          <table class="meta-table">
            <tr><td class="label">${isEn ? "Sessions:" : "Nombre de séances :"}</td><td class="value">${sessionsCount}</td></tr>
            <tr><td class="label">${isEn ? "Total Amount:" : "Montant forfait :"}</td><td class="value">${totalAmountGnf} GNF</td></tr>
          </table>
          <div class="cta-container">
            <a href="${appUrl}/parent/classes" class="cta-button">${isEn ? "View Details" : "Consulter les détails"}</a>
          </div>
        `;
        return {
          subject,
          html: renderHtmlLayout(subject, body, isEn, appUrl),
          text: `${subject}\n\n${name},\n${sessionsCount} séances - ${totalAmountGnf} GNF\n${appUrl}/parent/classes`,
        };
      }

      // 11. Schedule Changed (Rescheduled Session)
      case "schedule-changed": {
        const oldTime = data.oldTime || "Horaire précédent";
        const newTime = data.newTime || "Nouvel horaire";
        const reason = data.reason || (isEn ? "Schedule adjustment" : "Ajustement d'horaires");
        const subject = isEn ? "Lesson Session Rescheduled" : "Séance de cours reprogrammée";
        const body = `
          <h2 class="greeting">${isEn ? `Hello ${name},` : `Bonjour ${name},`}</h2>
          <p class="lead">${isEn
            ? `A tutoring session has been rescheduled. Please review the updated timing.`
            : `Une séance de cours a été reprogrammée. Veuillez noter le nouvel horaire convenu.`
          }</p>
          <table class="meta-table">
            <tr><td class="label">${isEn ? "Previous:" : "Horaire initial :"}</td><td class="value">${oldTime}</td></tr>
            <tr><td class="label">${isEn ? "New Time:" : "Nouvel horaire :"}</td><td class="value" style="font-weight: 700; color: #122b49;">${newTime}</td></tr>
            <tr><td class="label">${isEn ? "Reason:" : "Motif :"}</td><td class="value">${reason}</td></tr>
          </table>
          <div class="cta-container">
            <a href="${appUrl}/calendar" class="cta-button">${isEn ? "Open Calendar" : "Consulter mon calendrier"}</a>
          </div>
        `;
        return {
          subject,
          html: renderHtmlLayout(subject, body, isEn, appUrl),
          text: `${subject}\n\n${name},\n${oldTime} -> ${newTime}\n${appUrl}/calendar`,
        };
      }

      // 12. Lesson Cancelled
      case "lesson-cancelled": {
        const date = data.sessionDate || "La séance";
        const reason = data.reason || (isEn ? "Unforeseen event" : "Empêchement majeur");
        const subject = isEn ? "Lesson Session Cancelled" : "Annulation de séance de cours";
        const body = `
          <h2 class="greeting">${isEn ? `Hello ${name},` : `Bonjour ${name},`}</h2>
          <p class="lead">${isEn
            ? `The lesson scheduled for ${date} has been cancelled.`
            : `La séance de cours prévue le ${date} a été annulée.`
          }</p>
          <div class="info-box alert">
            <strong>${isEn ? "Reason:" : "Motif :"}</strong>
            <p style="margin: 4px 0 0 0;">${reason}</p>
          </div>
          <div class="cta-container">
            <a href="${appUrl}/calendar" class="cta-button">${isEn ? "View Calendar" : "Accéder au calendrier"}</a>
          </div>
        `;
        return {
          subject,
          html: renderHtmlLayout(subject, body, isEn, appUrl),
          text: `${subject}\n\n${name},\n${date} - ${reason}\n${appUrl}/calendar`,
        };
      }

      // 13. Upcoming Lesson Reminder (Automated Job)
      case "lesson-reminder": {
        const time = data.scheduledStart || "Demain";
        const subjectName = data.subjectName || "votre cours";
        const subject = isEn ? `Reminder: Upcoming ${subjectName} Lesson` : `Rappel : Séance de ${subjectName} prévue`;
        const body = `
          <h2 class="greeting">${isEn ? `Hello ${name},` : `Bonjour ${name},`}</h2>
          <p class="lead">${isEn
            ? `Friendly reminder: Your ${subjectName} lesson is scheduled for ${time} (Africa/Conakry).`
            : `Rappel bienveillant : Votre séance de ${subjectName} est prévue le ${time} (Heure de Conakry).`
          }</p>
          <div class="cta-container">
            <a href="${appUrl}/calendar" class="cta-button gold">${isEn ? "View Lesson Details" : "Consulter la séance"}</a>
          </div>
        `;
        return {
          subject,
          html: renderHtmlLayout(subject, body, isEn, appUrl),
          text: `${subject}\n\n${name},\n${time} - ${subjectName}\n${appUrl}/calendar`,
        };
      }

      // 14. Lesson Report Ready (Parent Validation Required)
      case "lesson-report-ready": {
        const teacherName = data.teacherName || "Le professeur";
        const subjectName = data.subjectName || "la matière";
        const subject = isEn ? `Lesson Report Ready for Validation (${subjectName})` : `Compte rendu de cours à valider (${subjectName})`;
        const body = `
          <h2 class="greeting">${isEn ? `Hello ${name},` : `Bonjour ${name},`}</h2>
          <p class="lead">${isEn
            ? `${teacherName} has submitted the pedagogical report for the completed ${subjectName} session. Please review and validate the session.`
            : `Le professeur ${teacherName} a déposé le compte rendu pédagogique de la séance de ${subjectName}. Veuillez le consulter et valider le cours.`
          }</p>
          <div class="cta-container">
            <a href="${appUrl}/parent/reports?sessionId=${data.sessionId || ""}" class="cta-button gold">${isEn ? "Review & Validate" : "Consulter & Valider"}</a>
          </div>
        `;
        return {
          subject,
          html: renderHtmlLayout(subject, body, isEn, appUrl),
          text: `${subject}\n\n${name},\n${isEn ? "Report submitted:" : "Compte rendu soumis :"}\n${appUrl}/parent/reports`,
        };
      }

      // 15. Lesson Approved (Notifies Teacher)
      case "lesson-approved": {
        const subjectName = data.subjectName || "la séance";
        const studentName = data.studentName || "l'élève";
        const subject = isEn ? `Lesson Approved by Family (${subjectName})` : `Séance validée par la famille (${subjectName})`;
        const body = `
          <h2 class="greeting">${isEn ? `Hello ${name},` : `Bonjour ${name},`}</h2>
          <p class="lead">${isEn
            ? `The family has officially approved the completed lesson session for ${studentName} in ${subjectName}.`
            : `La famille a officiellement validé la séance dispensée pour ${studentName} en ${subjectName}.`
          }</p>
          <div class="cta-container">
            <a href="${appUrl}/teacher/reports" class="cta-button">${isEn ? "View Reports" : "Consulter mes comptes rendus"}</a>
          </div>
        `;
        return {
          subject,
          html: renderHtmlLayout(subject, body, isEn, appUrl),
          text: `${subject}\n\n${name},\n${isEn ? "Approved by parent." : "Séance validée par le parent."}\n${appUrl}/teacher/reports`,
        };
      }

      // 16. Dispute Opened
      case "dispute-opened": {
        const reason = data.reason || (isEn ? "Lateness or duration disagreement" : "Désaccord sur les horaires ou la durée");
        const subject = isEn ? "Notice: A Lesson Dispute Has Been Opened" : "Information : Un litige de séance a été ouvert";
        const body = `
          <h2 class="greeting">${isEn ? `Hello ${name},` : `Bonjour ${name},`}</h2>
          <p class="lead">${isEn
            ? `A dispute has been submitted regarding a recent tutoring session. Our administration is reviewing the case.`
            : `Un litige a été ouvert concernant une séance de cours récente. L'administration Monsieur Fanyi instruit actuellement le dossier.`
          }</p>
          <div class="info-box alert">
            <strong>${isEn ? "Reason recorded:" : "Motif enregistré :"}</strong>
            <p style="margin: 4px 0 0 0;">${reason}</p>
          </div>
          <div class="cta-container">
            <a href="${appUrl}/admin/session-disputes" class="cta-button">${isEn ? "View Dispute" : "Consulter le dossier"}</a>
          </div>
        `;
        return {
          subject,
          html: renderHtmlLayout(subject, body, isEn, appUrl),
          text: `${subject}\n\n${name},\n${reason}\n${appUrl}/admin/session-disputes`,
        };
      }

      // 17. Dispute Resolved
      case "dispute-resolved": {
        const notes = data.adminNotes || (isEn ? "Agreement reached between parties." : "Décision administrative motivée.");
        const subject = isEn ? "Resolution Recorded on Lesson Dispute" : "Décision administrative enregistrée sur le litige";
        const body = `
          <h2 class="greeting">${isEn ? `Hello ${name},` : `Bonjour ${name},`}</h2>
          <p class="lead">${isEn
            ? `The Monsieur Fanyi administration has arbitrated the dispute. Please review the official decision note.`
            : `L'administration Monsieur Fanyi a statué sur le litige de cours. Veuillez prendre connaissance de la décision officielle.`
          }</p>
          <div class="info-box">
            <strong>${isEn ? "Administrative Decision:" : "Décision arbitrale :"}</strong>
            <p style="margin: 4px 0 0 0;">${notes}</p>
          </div>
          <div class="cta-container">
            <a href="${appUrl}/parent/reports" class="cta-button">${isEn ? "View Decision" : "Consulter la décision"}</a>
          </div>
        `;
        return {
          subject,
          html: renderHtmlLayout(subject, body, isEn, appUrl),
          text: `${subject}\n\n${name},\n${notes}\n${appUrl}/parent/reports`,
        };
      }

      // 18. Homework Assigned
      case "homework-assigned": {
        const title = data.title || "Devoir de cours";
        const subjectName = data.subjectName || "la matière";
        const dueDate = data.dueDate || (isEn ? "Next session" : "Prochaine séance");
        const subject = isEn ? `New Homework Assigned in ${subjectName}` : `Nouveau devoir assigné en ${subjectName}`;
        const body = `
          <h2 class="greeting">${isEn ? `Hello ${name},` : `Bonjour ${name},`}</h2>
          <p class="lead">${isEn
            ? `A new homework assignment "${title}" has been assigned in ${subjectName}.`
            : `Un nouveau devoir de maison intitulé « ${title} » a été assigné en ${subjectName}.`
          }</p>
          <table class="meta-table">
            <tr><td class="label">${isEn ? "Title:" : "Intitulé :"}</td><td class="value">${title}</td></tr>
            <tr><td class="label">${isEn ? "Due Date:" : "À rendre pour le :"}</td><td class="value">${dueDate}</td></tr>
          </table>
          <div class="cta-container">
            <a href="${appUrl}/parent/students/${data.studentId || ""}/progress#homework" class="cta-button">${isEn ? "Open Progress Book" : "Ouvrir le carnet de progression"}</a>
          </div>
        `;
        return {
          subject,
          html: renderHtmlLayout(subject, body, isEn, appUrl),
          text: `${subject}\n\n${name},\n${title} (${dueDate})\n${appUrl}/parent/students/${data.studentId || ""}/progress`,
        };
      }

      // 19. Assessment Recorded
      case "assessment-recorded": {
        const title = data.title || "Évaluation notée";
        const subjectName = data.subjectName || "la matière";
        const subject = isEn ? `New Assessment Recorded in ${subjectName}` : `Nouvelle évaluation enregistrée en ${subjectName}`;
        const body = `
          <h2 class="greeting">${isEn ? `Hello ${name},` : `Bonjour ${name},`}</h2>
          <p class="lead">${isEn
            ? `The teacher has recorded a new academic assessment (${title}) in ${subjectName}. Detailed scores and observations are available in your child's Digital Progress Book.`
            : `Le professeur a consigné une nouvelle évaluation (${title}) en ${subjectName}. Le relevé de note et les remarques sont consultables dans le carnet de progression.`
          }</p>
          <div class="cta-container">
            <a href="${appUrl}/parent/students/${data.studentId || ""}/progress#assessments" class="cta-button gold">${isEn ? "View Progress Book" : "Consulter le carnet de progression"}</a>
          </div>
        `;
        return {
          subject,
          html: renderHtmlLayout(subject, body, isEn, appUrl),
          text: `${subject}\n\n${name},\n${title} en ${subjectName}\n${appUrl}/parent/students/${data.studentId || ""}/progress`,
        };
      }

      // 20. Academic Progress Digest (Weekly/Monthly)
      case "academic-progress-digest":
      default: {
        const studentName = data.studentName || "votre enfant";
        const subject = isEn ? `Academic Progress Summary for ${studentName}` : `Bilan de progression pour ${studentName}`;
        const body = `
          <h2 class="greeting">${isEn ? `Hello ${name},` : `Bonjour ${name},`}</h2>
          <p class="lead">${isEn
            ? `Your periodic academic summary for ${studentName} is ready. Review completed sessions, homework status, and recent grades.`
            : `Le bilan de progression périodique pour ${studentName} est disponible. Retrouvez la synthèse des cours dispensés, devoirs rendus et notes obtenues.`
          }</p>
          <div class="cta-container">
            <a href="${appUrl}/parent/students/${data.studentId || ""}/progress" class="cta-button gold">${isEn ? "Download Official Bulletin" : "Consulter & Télécharger le bulletin"}</a>
          </div>
        `;
        return {
          subject,
          html: renderHtmlLayout(subject, body, isEn, appUrl),
          text: `${subject}\n\n${name},\n${isEn ? "Progress summary:" : "Bilan de progression :"}\n${appUrl}/parent/students/${data.studentId || ""}/progress`,
        };
      }
    }
  }
}
