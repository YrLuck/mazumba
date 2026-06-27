import type { Translations } from './en'

const ru: Translations = {
  // Nav
  chats: 'Чаты',
  channels: 'Каналы',
  activity: 'Активность',
  profile: 'Профиль',

  // Common
  back: 'Назад',
  save: 'Сохранить',
  cancel: 'Отмена',
  close: 'Закрыть',
  delete: 'Удалить',
  edit: 'Изменить',
  create: 'Создать',
  loading: 'Загрузка…',
  done: 'Готово',
  search: 'Поиск',
  optional: 'необязательно',
  send: 'Отправить',
  online: 'онлайн',
  offline: 'офлайн',
  yesterday: 'Вчера',
  today: 'Сегодня',
  now: 'сейчас',
  justNow: 'Только что',
  minAgo: (n: number) => `${n} мин`,
  hrAgo: (n: number) => `${n} ч`,
  daysAgo: (n: number) => `${n} дн`,

  // Auth
  welcomeBack: 'С возвращением',
  signInContinue: 'Войдите, чтобы продолжить',
  email: 'Email',
  password: 'Пароль',
  forgotPassword: 'Забыли?',
  signIn: 'Войти',
  orContinueWith: 'или войдите через',
  noAccount: 'Нет аккаунта?',
  signUp: 'Зарегистрироваться',
  createAccount: 'Создать аккаунт',
  joinCommunity: 'Присоединитесь к сообществу MiZumBA',
  fullName: 'Полное имя',
  fullNamePlaceholder: 'Ваше имя',
  usernamePlaceholder: '@username',
  emailPlaceholder: 'вы@mizumba.app',
  passwordPlaceholder: 'Мин. 8 символов',
  alreadyHaveAccount: 'Уже есть аккаунт?',
  allRequired: 'Пожалуйста, заполните все обязательные поля',
  minChars: 'Пароль должен содержать не менее 8 символов',
  loginFailed: 'Ошибка входа',
  registerFailed: 'Ошибка регистрации',

  // Chats
  searchChats: 'Поиск чатов…',
  noChatsYet: 'Нет чатов. Начните разговор!',
  noMessages: 'Нет сообщений. Поздоровайтесь!',
  messagePlaceholder: 'Сообщение…',
  loadingChats: 'Загрузка чатов…',
  loadingMessages: 'Загрузка…',
  newChat: 'Новый чат',
  reply: 'Ответить',
  editMessage: 'Изменить',
  deleteMessage: 'Удалить',
  deletedMessage: 'Сообщение удалено',
  edited: 'изменено',
  typing: 'печатает',
  copyText: 'Копировать',
  replyingTo: 'Ответ на',
  editingMessage: 'Редактирование',
  typeMessage: 'Введите сообщение…',
  recording: 'Запись…',
  member: 'участник',
  members: 'участников',
  addReaction: 'Реакция',
  sendFailed: 'Не удалось отправить',
  selectChat: 'Выберите чат, чтобы начать переписку',
  uploadingFile: 'Загрузка…',

  // Channels
  searchChannels: 'Поиск каналов…',
  noChannelsFound: 'Каналы не найдены.',
  subscribers: 'подписчиков',
  subscriber: 'подписчик',
  join: 'Подписаться',
  leave: 'Отписаться',
  posts: 'Записи',
  noPosts: 'Записей пока нет.',
  writePost: 'Написать запись…',
  publishPost: 'Опубликовать',
  selectChannel: 'Выберите канал для просмотра записей',
  createChannelBtn: 'Создать канал',

  // Activity
  newNotification: '1 новое уведомление',
  newNotifications: (n: number) => `${n} новых уведомлений`,
  markAllRead: 'Отметить все',
  earlier: 'Ранее',
  noActivity: 'Уведомлений пока нет.',
  loadingActivity: 'Загрузка…',

  // Profile
  editProfile: 'Редактировать',
  myProfile: 'Мой профиль',
  displayName: 'Имя',
  username: 'Логин',
  bioLabel: 'О себе',
  bioPlaceholder: 'Расскажите о себе…',
  changeAvatar: 'Изменить фото',
  logout: 'Выйти',
  loggingOut: 'Выход…',
  settingsSection: 'Настройки',
  notificationsSettings: 'Уведомления',
  notificationsDesc: 'Управление уведомлениями',
  privacySettings: 'Приватность',
  privacyDesc: 'Заблокированные, кто может писать',
  appearanceSettings: 'Внешний вид',
  appearanceDesc: 'Темная тема, язык',
  blockedUsers: 'Заблокированные',
  blockedDesc: 'Заблокированные пользователи',
  saveChanges: 'Сохранить изменения',
  saving: 'Сохранение…',
  profileUpdated: 'Профиль обновлён',
  statsMessages: 'Сообщений',
  statsGroups: 'Групп',
  statsChannels: 'Каналов',

  // Appearance settings
  theme: 'Тема',
  darkMode: 'Тёмная тема',
  lightMode: 'Светлая тема',
  language: 'Язык',
  langEnglish: 'Английский',
  langRussian: 'Русский',

  // Notification settings
  notifMessages: 'Новые сообщения',
  notifMentions: 'Упоминания',
  notifReactions: 'Реакции',
  notifGroupInvites: 'Приглашения в группы',
  notifChannelUpdates: 'Обновления каналов',

  // Privacy settings
  whoCanMessage: 'Кто может писать вам',
  everyone: 'Все',
  nobody: 'Никто',
  showOnlineStatus: 'Показывать статус онлайн',
  privacySaved: 'Настройки приватности сохранены',

  // Blocked users
  noBlockedUsers: 'Вы никого не заблокировали.',
  unblock: 'Разблокировать',
  blockedOn: 'Заблокирован',

  // Create modal
  createNew: 'Создать',
  group: 'Группа',
  channel: 'Канал',
  groupName: 'Название группы',
  channelName: 'Название канала',
  descriptionOptional: 'Описание (необязательно)',
  privateToggle: 'Приватный',
  nameRequired: 'Введите название',
  membersRequired: 'Добавьте хотя бы одного участника',
  searchMembers: 'Поиск участников…',
  noUsersFound: 'Пользователи не найдены',
  createFailed: 'Не удалось создать',
  creating: 'Создание…',
  createGroup: 'Создать группу',
  createChannel: 'Создать канал',

  // Scroll / pagination
  scrollToBottom: 'Вниз',
  loadEarlier: 'Загрузить раньше',
  noMoreMessages: 'Начало переписки',
  newMessages: 'новых сообщений',

  // Forward
  forward: 'Переслать',
  forwardTo: 'Переслать в',

  // Mute
  mute: 'Отключить звук',
  unmute: 'Включить звук',

  // Group info panel
  groupInfo: 'Информация о группе',
  removeMember: 'Удалить',
  addMember: 'Добавить участника',
  leaveGroup: 'Покинуть группу',
  deleteGroup: 'Удалить группу',
  ownerBadge: 'Владелец',
  adminBadge: 'Администратор',
  memberBadge: 'Участник',
  promoteMember: 'Сделать администратором',
  demoteMember: 'Сделать участником',

  // Channel management
  editChannelTitle: 'Изменить канал',
  deleteChannelBtn: 'Удалить канал',
  deletePost: 'Удалить пост',
  editPost: 'Изменить пост',
  confirmDelete: 'Вы уверены?',

  // Change password
  changePassword: 'Сменить пароль',
  changePasswordDesc: 'Обновите пароль аккаунта',
  currentPassword: 'Текущий пароль',
  newPassword: 'Новый пароль',
  confirmPassword: 'Подтвердите новый пароль',
  passwordChanged: 'Пароль обновлён!',
  passwordChangeFailed: 'Не удалось сменить пароль',
  passwordMismatch: 'Пароли не совпадают',

  // User profile card
  sendMessage: 'Написать',
  viewProfile: 'Профиль',
  blockUser: 'Заблокировать',

  // System theme
  systemTheme: 'Система',
  systemThemeDesc: 'Как на устройстве',
}

export default ru
