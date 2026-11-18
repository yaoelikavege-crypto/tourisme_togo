// =====================================
// PAGE 8 — À PROPOS ET CONTACT
// =====================================

import { echapper } from "../store.js";

export default async function pageAPropos({ conteneur, donnees }) {
  conteneur.innerHTML = `
    <section class="section section--ivoire section--serre">
      <div class="conteneur">
        <span class="surtitre">Le projet</span>
        <h1>À propos de Tourisme Togo</h1>
        <p class="catalogue-compte">
          Une plateforme ouverte pour découvrir, localiser et préparer la visite
          des sites touristiques du Togo.
        </p>
      </div>
    </section>

    <section class="section section--blanc">
      <div class="conteneur apropos-grille">
        <div>
          <h2>Notre mission</h2>
          <p>
            Rendre le patrimoine touristique togolais visible et accessible, en
            rassemblant sur une même carte les villes et les sites des cinq régions,
            avec des coordonnées GPS exploitables et des fiches descriptives.
          </p>
          <p>
            La plateforme est construite à partir de données libres : contours
            administratifs issus de geo-countries, fond de carte OpenStreetMap,
            photographies fournies par les contributeurs du projet.
          </p>

          <h2>Ce que contient la base aujourd'hui</h2>
          <ul class="apropos-liste">
            <li><strong>${donnees.villes.length}</strong> villes recensées</li>
            <li><strong>${donnees.sites.length}</strong> sites touristiques</li>
            <li><strong>5</strong> régions administratives</li>
            <li><strong>${donnees.lieux.filter((l) => l.image).length}</strong> photographies disponibles</li>
          </ul>

          <h2>Nos principes</h2>
          <ul class="apropos-liste">
            <li>Ne pas inventer de données : une information manquante reste signalée.</li>
            <li>Conserver les coordonnées GPS telles qu'elles ont été fournies.</li>
            <li>Indiquer clairement quelles distances sont estimées.</li>
            <li>Créditer les sources cartographiques sur chaque carte.</li>
          </ul>
        </div>

        <div>
          <h2>Nous contacter</h2>
          <form class="formulaire" id="formulaire-contact" novalidate>
            <div class="formulaire-champ">
              <label for="nom">Nom <span aria-hidden="true">*</span></label>
              <input id="nom" name="nom" type="text" required autocomplete="name">
              <span class="formulaire-erreur" data-erreur="nom"></span>
            </div>

            <div class="formulaire-champ">
              <label for="email">Adresse e-mail <span aria-hidden="true">*</span></label>
              <input id="email" name="email" type="email" required autocomplete="email">
              <span class="formulaire-erreur" data-erreur="email"></span>
            </div>

            <div class="formulaire-champ">
              <label for="sujet">Sujet <span aria-hidden="true">*</span></label>
              <select id="sujet" name="sujet" required>
                <option value="">Choisissez un sujet</option>
                <option value="suggestion">Suggérer une destination</option>
                <option value="correction">Signaler une erreur</option>
                <option value="partenariat">Partenariat</option>
                <option value="autre">Autre</option>
              </select>
              <span class="formulaire-erreur" data-erreur="sujet"></span>
            </div>

            <div class="formulaire-champ">
              <label for="message">Message <span aria-hidden="true">*</span></label>
              <textarea id="message" name="message" rows="6" required></textarea>
              <span class="formulaire-erreur" data-erreur="message"></span>
            </div>

            <button class="btn btn--principal" type="submit">Envoyer le message</button>

            <p class="formulaire-note">
              Ce formulaire fonctionne sans serveur : à la validation, il prépare
              un e-mail prérempli dans votre logiciel de messagerie. Aucune donnée
              n'est envoyée ni stockée par le site.
            </p>
          </form>
        </div>
      </div>
    </section>
  `;

  // ---- Validation du formulaire
  const formulaire = conteneur.querySelector("#formulaire-contact");

  function erreur(champ, message) {
    const zone = formulaire.querySelector(`[data-erreur="${champ}"]`);
    const input = formulaire.querySelector(`#${champ}`);

    if (zone) zone.textContent = message || "";
    if (input) input.classList.toggle("invalide", Boolean(message));

    return !message;
  }

  function valider() {
    const nom = formulaire.nom.value.trim();
    const email = formulaire.email.value.trim();
    const sujet = formulaire.sujet.value;
    const message = formulaire.message.value.trim();

    const emailValide = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

    let ok = true;
    ok = erreur("nom", nom.length < 2 ? "Indiquez votre nom (2 caractères minimum)." : "") && ok;
    ok = erreur("email", emailValide ? "" : "Indiquez une adresse e-mail valide.") && ok;
    ok = erreur("sujet", sujet ? "" : "Choisissez un sujet.") && ok;
    ok = erreur(
      "message",
      message.length < 10 ? "Votre message doit contenir au moins 10 caractères." : "",
    ) && ok;

    return ok ? { nom, email, sujet, message } : null;
  }

  formulaire.addEventListener("submit", (evenement) => {
    evenement.preventDefault();

    const donneesValides = valider();
    if (!donneesValides) {
      const premierInvalide = formulaire.querySelector(".invalide");
      if (premierInvalide) premierInvalide.focus();
      return;
    }

    const sujet = `[Tourisme Togo] ${donneesValides.sujet}`;
    const corps = `${donneesValides.message}\n\n— ${donneesValides.nom} (${donneesValides.email})`;

    window.location.href = `mailto:contact@tourisme-togo.tg?subject=${encodeURIComponent(
      sujet,
    )}&body=${encodeURIComponent(corps)}`;

    formulaire.reset();

    const note = formulaire.querySelector(".formulaire-note");
    note.textContent =
      "Votre logiciel de messagerie s'ouvre avec le message prérempli. Aucune donnée n'est stockée par le site.";
  });

  // Effacement des erreurs à la saisie
  formulaire.querySelectorAll("input, select, textarea").forEach((champ) => {
    champ.addEventListener("input", () => {
      if (champ.id) erreur(champ.id, "");
    });
  });

  return null;
}
