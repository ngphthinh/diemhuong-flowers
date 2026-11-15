import { Schema, model, models, type Model } from "mongoose";

export interface ICounter {
  _id: string; // tên bộ đếm, ví dụ "product"
  seq: number;
}

const CounterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, required: true, default: 0 },
});

export const Counter: Model<ICounter> =
  (models.Counter as Model<ICounter>) || model<ICounter>("Counter", CounterSchema, "counters");

/** Tăng và trả về giá trị tiếp theo (atomic). */
export async function nextSequence(name: string): Promise<number> {
  const doc = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();
  return doc!.seq;
}
