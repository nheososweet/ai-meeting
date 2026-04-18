# Refactor Plan Checklist (No Regression)

Muc tieu:

- Tach nho file dai de de quan ly, de review, de test.
- Khong thay doi behavior va khong pha vo luong hien tai.
- Sau moi dot sua, bat buoc test ky theo checklist ben duoi.

Nguyen tac bat buoc:

- Khong doi API contract cua pipeline va send-email.
- Khong doi thu tu pipeline step.
- Moi phase chi refactor cau truc, khong them nghiep vu moi.
- Chia nho PR/commit theo phase de rollback de.

---

## Phase 0 - Baseline truoc khi tach

### Viec can lam

- [ ] Tao branch refactor rieng (goi y: refactor/no-regression-split)
- [ ] Chay lint baseline
- [ ] Chay build baseline
- [ ] Ghi lai cac canh bao/loi hien tai (neu co) de doi chieu sau
- [ ] Chot checklist manual smoke test (ben duoi)

### Test bat buoc sau phase

- [ ] pnpm lint
- [ ] pnpm build
- [ ] Smoke test 4 luong chinh (muc "Manual smoke test")

---

## Phase 1 - Tach pure utils khoi workspace page

Pham vi: app/(main)/workspace/page.tsx

### Viec can lam

- [x] Tao app/(main)/workspace/\_lib/pipeline-constants.ts
- [x] Tao app/(main)/workspace/\_lib/transcript-utils.ts
- [x] Tao app/(main)/workspace/\_lib/format-utils.ts
- [x] Tao app/(main)/workspace/\_lib/validation.ts
- [x] Move cac ham pure va constants tu page sang \_lib
- [x] Giu nguyen import/usage trong page (chi doi duong dan)

### Test bat buoc sau phase

- [x] pnpm lint (scoped files da sua)
- [x] pnpm build
- [x] Upload 1 file hop le -> bam xu ly -> pipeline van chay
- [x] Upload file khong hop le -> warning hien dung
- [x] Copy transcript/refined transcript van hoat dong

---

## Phase 2 - Tach dialog UI trong workspace vao \_components

Pham vi: app/(main)/workspace/page.tsx

### Viec can lam

- [x] Tao app/(main)/workspace/\_components/EmailDialog.tsx
- [x] Tao app/(main)/workspace/\_components/MinutesEditorDialog.tsx
- [x] Tao app/(main)/workspace/\_components/TranscriptComparisonDialog.tsx
- [x] Tao app/(main)/workspace/\_components/PipelineProgressCard.tsx
- [x] Tao app/(main)/workspace/\_components/SessionInfoCard.tsx
- [x] Parent page chi giu state + callbacks + orchestration

### Test bat buoc sau phase

- [x] pnpm lint
- [x] pnpm build
- [x] Mo/dong tung dialog khong loi
- [x] Validate email sai hien message dung
- [x] Luu bien ban thanh cong va dong dialog dung logic

---

## Phase 3 - Tach upload/recording state vao \_hooks

Pham vi: app/(main)/workspace/page.tsx

### Viec can lam

- [x] Tao app/(main)/workspace/\_hooks/useWorkspaceUpload.ts
- [x] Tao app/(main)/workspace/\_hooks/useWorkspaceRecording.ts
- [x] Tao app/(main)/workspace/\_hooks/useWorkspaceToast.ts
- [x] Move logic drag-drop, file input, recording lifecycle, toast timer
- [x] Dam bao cleanup URL object va media stream khi unmount/switch mode

### Test bat buoc sau phase

- [x] pnpm lint
- [x] pnpm build
- [x] Drag-drop file va select file deu hoat dong
- [x] Thu am -> dung -> preview audio duoc
- [x] Switch mode upload/recording nhieu lan khong crash

---

## Phase 4 - Tach pipeline orchestration vao hook (RUI RO CAO)

Pham vi: app/(main)/workspace/page.tsx

### Viec can lam

- [x] Tao app/(main)/workspace/\_hooks/useWorkspacePipeline.ts
- [x] Move startProcessing + retry + timer control + step transition
- [x] Giu runId/ref guard de tranh race condition
- [x] Giu logic mark error va retry nhu cu

### Test bat buoc sau phase

- [x] pnpm lint
- [x] pnpm build
- [x] Upload -> pipeline hoan tat 4 buoc
- [x] Dang chay pipeline, doi mode giua chung -> khong loi timer zombie
- [x] Tao loi co chu y (input bat thuong) -> retry van chay lai duoc

---

## Phase 5 - Tach history page thanh \_components + \_hooks

Pham vi: app/(main)/history/page.tsx

### Viec can lam

- [x] Tao app/(main)/history/\_components/HistoryHeaderMetrics.tsx
- [x] Tao app/(main)/history/\_components/HistoryRecordItem.tsx
- [x] Tao app/(main)/history/\_components/TranscriptPreviewDialog.tsx
- [x] Tao app/(main)/history/\_components/ReportPreviewDialog.tsx
- [x] Tao app/(main)/history/\_components/SendEmailDialog.tsx
- [x] Tao app/(main)/history/\_hooks/useHistoryTranscriptPreview.ts
- [x] Tao app/(main)/history/\_hooks/useHistoryEmail.ts
- [x] Tao app/(main)/history/\_hooks/useHistoryToast.ts
- [x] Tao app/(main)/history/\_lib/file-utils.ts

### Test bat buoc sau phase

- [x] pnpm lint
- [x] pnpm build
- [x] Xem transcript record bat ky duoc
- [x] Xem report duoc (neu co CORS thi thong bao dung)
- [x] Gui email tu history duoc
- [x] Download audio/transcript/report van dung link

---

## Phase 6 - Tach history detail view thanh section nho

Pham vi: components/history/history-detail-view.tsx

### Viec can lam

- [x] Tao components/history/\_components/PlaybackSection.tsx
- [x] Tao components/history/\_components/TranscriptSegmentsSection.tsx
- [x] Tao components/history/\_components/MinutesSection.tsx
- [x] Tao components/history/\_components/EmailLogSection.tsx
- [x] Tao components/history/\_hooks/usePlaybackSimulation.ts

### Test bat buoc sau phase

- [x] pnpm lint
- [x] pnpm build
- [x] Play/pause/reset playback dung
- [x] Click segment -> jump dung time
- [x] Email log simulation van cap nhat dung

---

## Phase 7 - Cleanup va toi uu nhe

### Viec can lam

- [x] Loai bo code duplicate sau khi tach
- [x] Chuan hoa naming \_components/\_hooks/\_lib
- [x] Kiem tra lai import cycle
- [x] Toi uu re-render cho list item/dialog can thiet

### Test bat buoc sau phase

- [x] pnpm lint (scoped refactor files: pnpm lint:refactor)
- [x] pnpm build
- [x] Chay lai full manual smoke test

---

## Manual smoke test (bat buoc sau moi phase)

### Luong 1 - Workspace upload full flow

- [x] Chon file audio hop le
- [x] Chay pipeline den completed
- [x] Mo/sua/lưu bien ban
- [x] Gui email thanh cong

### Luong 2 - Workspace recording full flow

- [x] Bat dau thu am
- [x] Dung thu am, preview audio
- [x] Chay pipeline den completed
- [x] Gui email thanh cong

### Luong 3 - History flow

- [x] Load danh sach records thanh cong
- [x] Preview transcript
- [x] Preview report
- [x] Gui email tu history

### Luong 4 - Error va retry

- [x] Gap loi tai 1 buoc pipeline (neu co)
- [x] Nut retry hoat dong
- [x] Pipeline tiep tuc duoc khong vo trang thai

---

## Rule thuc thi moi lan sua

- [ ] Moi lan sua xong phai chay pnpm lint
- [ ] Moi lan sua xong phai chay pnpm build
- [ ] Moi lan sua xong phai tick lai manual smoke test lien quan
- [ ] Khong merge phase neu con fail test
