# Manual Smoke Fast Script (Workspace + History)

Muc tieu:

- Chay nhanh 4 luong smoke test trong 10-15 phut.
- Tick checklist no-regression ngay sau khi chay.

## 0) Chuan bi

1. Terminal A:

```powershell
Set-Location 'c:\Data\2026\ai-speech-translator'
pnpm dev
```

2. Terminal B:

```powershell
Set-Location 'c:\Data\2026\ai-speech-translator'
pnpm lint:refactor
pnpm build
```

3. Mo trinh duyet:

- http://localhost:3000/workspace
- http://localhost:3000/history

4. Chuan bi 1 file audio test bat ky (wav/mp3/webm/ogg, <= 100MB).

## 1) Luong Workspace Upload Full Flow

1. Vao Workspace, chon tab Tai tep.
2. Keo-tha hoac chon file audio hop le.
3. Bam Xu ly, doi pipeline chay den Hoan tat.
4. Mo Xem/Sua bien ban, sua 1 dong ngan, bam Luu bien ban.
5. Bam Gui email, nhap 1-2 email hop le, bam Xac nhan gui.

Expected:

- Pipeline hien du 4 buoc va ket thuc completed.
- Bien ban luu thanh cong.
- Toast gui email thanh cong.

## 2) Luong Workspace Recording Full Flow

1. Chuyen sang tab Thu am truc tiep.
2. Bam Bat dau thu, cho 5-10 giay, bam Dung thu.
3. Xac nhan co preview audio.
4. Bam Xu ly ban thu, doi completed.
5. Gui email nhu luong upload.

Expected:

- Thu am hoat dong, co preview.
- Pipeline recording completed.
- Gui email thanh cong.

## 3) Luong History Flow

1. Vao History list.
2. Mo preview transcript 1 record, test nut copy transcript.
3. Mo preview report (neu record co reportUrl).
4. Test gui email tu History.
5. Test download audio/transcript/report.

Expected:

- Dialog transcript/report mo dong dung.
- Copy/download/gui email hoat dong dung luong.

## 4) Luong Error va Retry

1. Vao Workspace, chon file hop le.
2. Bam Xu ly, trong luc dang chay thi tat mang tam thoi hoac dung endpoint de tao loi.
3. Xac nhan step loi va nut Thu lai buoc loi hien ra.
4. Bat mang lai, bam Thu lai buoc loi.

Expected:

- Pipeline vao trang thai error dung buoc.
- Retry chay lai duoc va co the completed.

## 5) Tick checklist sau khi chay

Cap nhat file ke hoach:

- plans/2026-04-18-refactor-checklist-no-regression.md

Danh dau:

- Tat ca muc trong Manual smoke test.
- Muc manual con lai trong Phase 1->7.
- Phase 7 lint theo pham vi refactor (pnpm lint:refactor).
- Phase 7 build.
