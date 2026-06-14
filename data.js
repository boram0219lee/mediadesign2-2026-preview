const works = [
  {
    name: "테스트",
    title: "Test Creature",
    description: "마우스 움직임과 클릭에 반응하는 테스트용 디지털 생명체입니다.",
    link: "works/test-creature/index.html",
    displayMode: "local",
    thumbnail: "",
    input: "mouse",
    inputLabel: "마우스 움직임 / 클릭",
    interaction: "마우스를 움직이면 생명체가 따라 반응하고, 화면을 클릭하면 사운드가 시작됩니다.",
    reaction: "마우스 위치에 따라 생명체의 위치, 시선, 주변 입자의 움직임이 달라집니다.",
    sound: true,
    soundGuide: "사운드가 포함된 작품입니다. 브라우저 정책상 자동 재생이 차단될 수 있으므로, 화면을 클릭한 뒤 체험해 주세요."
  }

  /*
  학생 작품 추가 템플릿:
  ,{
    name: "학생이름",
    title: "작품 제목",
    description: "작품 설명 1~2문장",
    link: "works/folder-name/index.html",
    displayMode: "local",
    thumbnail: "thumbnails/folder-name.jpg",
    input: "mouse",
    inputLabel: "마우스 움직임",
    interaction: "관람자가 어떻게 인터랙션하면 되는지",
    reaction: "인터랙션에 따라 무엇이 달라지는지",
    sound: false,
    soundGuide: ""
  }

  displayMode:
  - local: works/폴더명/index.html 자체 HTML 작품
  - embed: p5.js Editor embed 링크 임시 사용
  - external: 웹캠/아두이노 등 새 탭 실행 권장 작품
  */
];
