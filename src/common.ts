function onHomepage(e: GoogleAppsScript.Addons.EventObject) {
  return createCard(true)
}

function createCard(isHomepage: boolean) {
  if (!isHomepage) {
    isHomepage = false
  }
  const section = CardService.newCardSection().addWidget(
    CardService.newTextParagraph().setText('a file is not selected')
  )
  const card = CardService.newCardBuilder()
  card.addSection(section)
  return card.build()
}
