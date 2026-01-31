import styles from "@/app/legal/LegalPage.module.css";

export default function LegalTermsOfServiceContent() {
  return (
    <>
      <h3 className={styles.articleTitle}>제1조(목적)</h3>
      <p>
        본 약관은 에디(EDi)와의 감정일기: AI제안 · AI분석(이하 “회사”)가
        제공하는 감정 기록 및 자기 성찰을 지원하는 서비스(웹 및 모바일 앱 포함,
        이하 “서비스”)의 이용과 관련하여 회사와 이용자 간의 권리·의무 및
        책임사항을 규정함을 목적으로 합니다.
      </p>

      <h3 className={styles.articleTitle}>제2조(정의)</h3>
      <ol className={styles.list}>
        <li>
          “이용자”란 본 약관에 동의하고 서비스를 이용하는 자를 말합니다(회원 및
          비회원 포함).
        </li>
        <li>
          “회원”이란 회사가 정한 절차에 따라 계정을 생성한 이용자를 말합니다.
        </li>
        <li>“비회원”이란 계정 없이 서비스를 이용하는 자를 말합니다.</li>
        <li>
          “콘텐츠”란 이용자가 서비스에 입력하거나 생성하는 감정, 생각, 상황,
          메모, 질문 응답 등 모든 기록을 말합니다.
        </li>
        <li>
          “AI 기능”이란 이용자 입력을 기반으로 인공지능 모델을 활용하여 질문,
          요약, 피드백 등을 제공하는 기능을 말합니다.
        </li>
      </ol>

      <h3 className={styles.articleTitle}>제3조(약관의 게시 및 변경)</h3>
      <ol className={styles.list}>
        <li>회사는 본 약관을 서비스 내에 게시합니다.</li>
        <li>
          회사는 관련 법령을 위반하지 않는 범위에서 약관을 변경할 수 있으며,
          중요한 변경 시 서비스 내 공지 등 합리적인 방법으로 고지합니다.
        </li>
        <li>
          이용자가 변경 약관 시행 이후 서비스를 계속 이용하는 경우 변경에 동의한
          것으로 봅니다.
        </li>
      </ol>

      <h3 className={styles.articleTitle}>제4조(이용 연령)</h3>
      <p>본 서비스는 만 18세 이상만 이용할 수 있습니다.</p>

      <h3 className={styles.articleTitle}>제5조(서비스의 성격 및 의료 고지)</h3>
      <ol className={styles.list}>
        <li>
          본 서비스는 자기이해 및 정서 관리를 돕기 위한 정보 제공 및 기록 지원
          서비스이며, 의료 서비스 또는 의료기기가 아닙니다.
        </li>
        <li>
          회사는 질병, 정신건강 상태 또는 심리적 문제에 대한 진단이나 치료를
          제공하지 않습니다.
        </li>
        <li>
          AI 기능의 결과물은 참고용 정보이며, 전문가의 판단을 대체하지 않습니다.
        </li>
        <li>
          이용자는 건강 또는 심리적 문제가 의심될 경우 반드시 의료 또는 상담
          전문가의 도움을 받아야 합니다.
        </li>
      </ol>

      <h3 className={styles.articleTitle}>제6조(긴급상황 안내)</h3>
      <p>
        자해 또는 자살 충동, 기타 긴급 위험 상황에서는 즉시 119 또는 인근
        응급기관에 연락해야 하며, 서비스는 긴급 대응 수단이 아닙니다.
      </p>

      <h3 className={styles.articleTitle}>제7조(회원가입 및 계정)</h3>
      <ol className={styles.list}>
        <li>
          회원가입은 이메일 기반 자체 회원가입 또는 소셜 로그인(예: Google)
          방식으로 제공될 수 있습니다.
        </li>
        <li>이용자는 정확한 정보를 제공해야 합니다.</li>
        <li>
          이용자는 계정 정보의 보안을 유지할 책임이 있으며, 무단 사용이 의심되는
          경우 즉시 회사에 알려야 합니다.
        </li>
      </ol>

      <h3 className={styles.articleTitle}>제8조(비회원 이용 및 저장 방식)</h3>
      <ol className={styles.list}>
        <li>비회원도 일부 기능을 이용할 수 있습니다.</li>
        <li>
          비회원의 콘텐츠는 원칙적으로 이용자 기기 내 로컬 저장소에 저장되며,
          회사 서버에는 저장되지 않을 수 있습니다.
        </li>
        <li>
          기기 변경, 브라우저 데이터 삭제 등으로 인한 콘텐츠 손실에 대해 회사는
          책임을 지지 않습니다.
        </li>
      </ol>

      <h3 className={styles.articleTitle}>제9조(회원 콘텐츠 저장)</h3>
      <p>
        회원의 콘텐츠는 서비스 제공을 위해 회사의 서버 및 데이터베이스에 저장될
        수 있으며, 삭제 및 보관에 관한 사항은 개인정보 처리방침을 따릅니다.
      </p>

      <h3 className={styles.articleTitle}>제10조(AI 기능)</h3>
      <ol className={styles.list}>
        <li>
          AI 기능은 서비스의 핵심 기능의 일부로 제공되며, 이용자는 서비스 이용을
          위해 해당 기능 이용 및 국외 이전에 동의해야 합니다
        </li>
        <li>
          AI 기능 이용 시 이용자가 입력한 일부 또는 전부의 텍스트가 AI 처리
          제공업체 (국외 포함)로 전송되어 처리될 수 있습니다.
        </li>
        <li>
          회사는 AI 기능 결과물의 정확성 또는 이용 결과에 대해 책임을 지지
          않습니다.
        </li>
      </ol>

      <h3 className={styles.articleTitle}>제11조(향후 유료 서비스)</h3>
      <p>회사는 향후 유료 서비스 또는 구독 기능을 도입할 수 있습니다.</p>
      <p>
        이 경우 관련 법령에 따라 결제 및 환불 정책을 별도로 고지하고 동의를
        받으며, 결제·정산을 위해 필요한 최소한의 개인정보를 추가로 수집·이용할
        수 있습니다.
      </p>

      <h3 className={styles.articleTitle}>제12조(금지행위)</h3>
      <ul className={styles.list}>
        <li>타인의 개인정보 또는 계정 도용</li>
        <li>불법, 혐오, 폭력, 성적 착취, 명예훼손, 괴롭힘 콘텐츠 작성</li>
        <li>서비스 운영 방해 행위</li>
        <li>관련 법령 및 본 약관 위반</li>
      </ul>

      <h3 className={styles.articleTitle}>제13조(서비스 변경 및 중단)</h3>
      <p>
        회사는 운영 또는 기술상 필요에 따라 서비스의 전부 또는 일부를 변경하거나
        중단할 수 있으며, 중요한 변경 사항은 사전 고지합니다.
      </p>

      <h3 className={styles.articleTitle}>제14조(지식재산권)</h3>
      <p>
        서비스 및 회사 제공 자료에 대한 권리는 회사 또는 정당한 권리자에게
        귀속되며, 이용자는 서비스 이용 목적 외 사용을 할 수 없습니다.
      </p>

      <h3 className={styles.articleTitle}>제15조(책임 제한)</h3>
      <p>
        회사는 법령이 허용하는 범위에서 서비스 이용과 관련된 손해에 대해 책임을
        제한할 수 있습니다.
      </p>

      <h3 className={styles.articleTitle}>제16조(준거법 및 관할)</h3>
      <p>
        본 약관은 대한민국 법령을 준거법으로 하며, 분쟁은 민사소송법상 관할
        법원을 따릅니다.
      </p>
    </>
  );
}
