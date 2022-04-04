import { GitHubAppToken } from '@hankei6km/gas-github-app-token'

function errCard_(
  card: GoogleAppsScript.Card_Service.CardBuilder,
  msg: string
) {
  const section = CardService.newCardSection().addWidget(
    CardService.newTextParagraph().setText(msg)
  )
  card.addSection(section)
}

function onDriveItemsSelected(e: GoogleAppsScript.Addons.EventObject) {
  const card = CardService.newCardBuilder()
  if (e.drive?.activeCursorItem) {
    const mimeType = e.drive?.activeCursorItem.mimeType
    if (mimeType === 'text/markdown') {
      const fileName = e.drive?.activeCursorItem.title
      const text = CardService.newTextParagraph().setText(
        `selected ${fileName}`
      )
      const action = CardService.newAction().setFunctionName(
        'doDispatchWithContent'
      )
      const button = CardService.newTextButton()
        .setText('dispatch')
        .setOnClickAction(action)
      // Group?
      const buttonSet = CardService.newButtonSet().addButton(button)

      // section
      const section = CardService.newCardSection()
        .addWidget(text)
        .addWidget(buttonSet)
      card.addSection(section)
    } else {
      errCard_(
        card,
        `Support "text/markdown" only. ${mimeType} is not support.`
      )
    }
  } else {
    errCard_(card, 'Multiple select is not support.')
  }
  return card.build()
}

function dispatch_(content: string): string {
  let ret = ''

  const props = PropertiesService.getScriptProperties()

  const appId = props.getProperty('appId') || ''
  const installationId = props.getProperty('installationId') || ''
  const privateKey = props.getProperty('privateKey') || ''

  const owner = props.getProperty('owner') || ''
  const repo = props.getProperty('repo') || ''
  const workflowId = props.getProperty('workflowId') || ''
  // const ref = props.getProperty('ref') || ''
  const ref = 'topic/workflow3'

  const apiBaseUrl = 'https://api.github.com'

  const [url, opts] = GitHubAppToken.generate({
    appId,
    installationId,
    privateKey
  })

  const res = UrlFetchApp.fetch(url, opts)
  const token = JSON.parse(res.getContentText()).token

  const path = `/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`
  try {
    const runRes = UrlFetchApp.fetch(`${apiBaseUrl}${path}`, {
      method: 'post',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json'
      },
      payload: JSON.stringify({
        ref,
        inputs: { slides: content }
      })
    })
  } catch (e: any) {
    console.error(e)
    ret = 'error occured in dispatch workflow'
  }
  return ret
}

function doDispatchWithContent(e: GoogleAppsScript.Addons.EventObject) {
  const card = CardService.newCardBuilder()
  if (e.drive?.activeCursorItem) {
    const fileId = e.drive.activeCursorItem.id
    const mimeType = e.drive.activeCursorItem.mimeType
    const file = DriveApp.getFileById(fileId || '')

    // const content = file.getBlob().getDataAsString()
    const content = file
      // .getAs(GoogleAppsScript.Base.MimeType.PLAIN_TEXT)
      .getAs('text/plain')
      .getDataAsString()

    const msg = dispatch_(content)

    if (msg === '') {
      const textFileId = CardService.newTextParagraph().setText(`${mimeType}`)
      const textMimeType = CardService.newTextParagraph().setText(`${fileId}`)
      const textContent = CardService.newTextParagraph().setText(`${content}`)

      const section = CardService.newCardSection()
        .addWidget(textFileId)
        .addWidget(textMimeType)
        .addWidget(textContent)
      card.addSection(section)
    } else {
      errCard_(card, msg)
    }
  } else {
    errCard_(card, 'Multiple select is not support.')
  }
  return card.build()
}
