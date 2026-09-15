import Image from "next/image";

import { team } from "../content";
import styles from "./home.module.css";

export function Team() {
  return (
    <section
      className={`container ${styles.section}`}
      aria-labelledby="team-title"
    >
      <div className={styles.centerHeading}>
        <p className={styles.eyebrow}>Чотирилапа команда Curly Joy</p>
        <h2 id="team-title">Знайомтесь з командою</h2>
      </div>
      <ul className={styles.teamGrid}>
        {team.map((member) => (
          <li key={member.role} className={styles.teamCard}>
            <Image
              src={member.image}
              alt={member.description}
              width={170}
              height={170}
              sizes="(max-width: 700px) 40vw, 170px"
            />
            <h3>{member.role}</h3>
            <p>{member.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
