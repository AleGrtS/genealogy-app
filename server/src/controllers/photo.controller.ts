import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import Photo from '../models/Photo';
import Person from '../models/Person';

// Создаем директорию для загрузок, если её нет
const UPLOAD_DIR = path.join(__dirname, '../../uploads/photos');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Настройка multer для сохранения файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const fileId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${fileId}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Только изображения разрешены!'));
    }
  }
});

// Загрузка фото
export const uploadPhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    const { personId } = req.params;
    const { caption } = req.body;
    const file = req.file;

    if (!file) {
      res.status(400).json({ success: false, message: 'Файл не выбран' });
      return;
    }

    // Проверяем существование человека
    const person = await Person.findByPk(personId);
    if (!person) {
      res.status(404).json({ success: false, message: 'Человек не найден' });
      return;
    }

    // Если это первое фото, делаем его главным
    const photoCount = await Photo.count({ where: { personId } });
    const isMain = photoCount === 0;

    // Сохраняем в базу данных
    const photo = await Photo.create({
      personId: parseInt(personId),
      filename: file.filename,
      originalName: file.originalname,
      path: `/uploads/photos/${file.filename}`,
      thumbnailPath: `/uploads/photos/${file.filename}`, // Пока используем то же фото
      size: file.size,
      mimeType: file.mimetype,
      isMain,
      caption: caption || null,
    });

    res.status(201).json({
      success: true,
      message: 'Фото загружено успешно',
      data: photo
    });

  } catch (error: any) {
    console.error('Ошибка загрузки фото:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка загрузки фото',
      error: error.message
    });
  }
};

// Получить все фото человека
export const getPersonPhotos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { personId } = req.params;
    
    const photos = await Photo.findAll({
      where: { personId },
      order: [['isMain', 'DESC'], ['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: photos.length,
      data: photos
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения фото',
      error: error.message
    });
  }
};

// Удалить фото
export const deletePhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const photo = await Photo.findByPk(id);
    if (!photo) {
      res.status(404).json({ success: false, message: 'Фото не найдено' });
      return;
    }

    // Удаляем файл
    const filePath = path.join(UPLOAD_DIR, photo.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Удаляем запись из БД
    await photo.destroy();

    res.json({
      success: true,
      message: 'Фото удалено успешно'
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Ошибка удаления фото',
      error: error.message
    });
  }
};

// Установить фото как главное
export const setMainPhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { personId } = req.body;

    // Снимаем главное фото со всех
    await Photo.update({ isMain: false }, { where: { personId } });

    // Устанавливаем новое главное
    await Photo.update({ isMain: true }, { where: { id } });

    res.json({
      success: true,
      message: 'Главное фото обновлено'
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Ошибка установки главного фото',
      error: error.message
    });
  }
};

// Middleware для загрузки одного файла
export const uploadSingle = upload.single('photo');
